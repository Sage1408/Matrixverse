import { createClient } from "@supabase/supabase-js"

export async function GET(req) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return Response.json({ error: "No auth" }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { data: memberships } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id)

    if (!memberships || memberships.length === 0) return Response.json({ conversations: [] })

    const ids = memberships.map(m => m.conversation_id)

    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", ids)

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url, display_name")

    const profileMap = {}
    profiles?.forEach(p => { profileMap[p.user_id] = p })

    const { data: lastMessages } = await supabase
      .from("messages")
      .select("conversation_id, content, created_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false })

    const lastMsgMap = {}
    const seen = new Set()
    lastMessages?.forEach(m => {
      if (!seen.has(m.conversation_id)) {
        seen.add(m.conversation_id)
        lastMsgMap[m.conversation_id] = m
      }
    })

    const conversations = await Promise.all(ids.map(async (cid) => {
      const other = participants?.find(p => p.conversation_id === cid && p.user_id !== user.id)
      const otherProfile = other ? profileMap[other.user_id] : null

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", cid)
        .neq("sender_id", user.id)
        .is("read_at", null)

      return {
        id: cid,
        other_user: otherProfile ? {
          user_id: other.user_id,
          username: otherProfile.username,
          avatar_url: otherProfile.avatar_url,
          display_name: otherProfile.display_name,
        } : null,
        last_message: lastMsgMap[cid] || null,
        unread_count: count || 0,
      }
    }))

    conversations.sort((a, b) => {
      const aTime = a.last_message?.created_at || ""
      const bTime = b.last_message?.created_at || ""
      return bTime.localeCompare(aTime)
    })

    return Response.json({ conversations })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return Response.json({ error: "No auth" }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { participant_id } = await req.json()
    if (!participant_id) return Response.json({ error: "participant_id required" }, { status: 400 })

    const { data: existing } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        conversation_participants!inner(user_id)
      `)
      .eq("user_id", user.id)

    const matching = existing?.filter(e => {
      return e.conversation_participants?.some(p => p.user_id === participant_id)
    })

    if (matching && matching.length > 0) {
      return Response.json({ conversation_id: matching[0].conversation_id, existing: true })
    }

    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .insert([{}])
      .select()
      .single()

    if (convErr) return Response.json({ error: convErr.message }, { status: 500 })

    await supabase.from("conversation_participants").insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: participant_id },
    ])

    return Response.json({ conversation_id: conv.id, existing: false })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
