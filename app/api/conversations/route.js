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

    const { data: convs } = await supabase
      .from("conversations")
      .select("id, name, avatar_url, created_at")
      .in("id", ids)

    const convMap = {}
    convs?.forEach(c => { convMap[c.id] = c })

    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", ids)

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url, display_name")

    const profileMap = {}
    profiles?.forEach(p => { profileMap[p.user_id] = p })

    // Count participants per conversation to detect groups
    const participantCounts = {}
    const participantMap = {}
    participants?.forEach(p => {
      if (!participantCounts[p.conversation_id]) participantCounts[p.conversation_id] = 0
      participantCounts[p.conversation_id]++
      if (!participantMap[p.conversation_id]) participantMap[p.conversation_id] = []
      participantMap[p.conversation_id].push(p.user_id)
    })

    const { data: lastMessages } = await supabase
      .from("messages")
      .select("conversation_id, content, created_at, file_name, image_url, audio_url")
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
      const conv = convMap[cid]
      const isGroup = participantCounts[cid] > 2
      const otherParticipants = participantMap[cid]?.filter(pid => pid !== user.id) || []

      let displayName = ""
      let avatarUrl = ""
      let otherUser = null

      if (isGroup) {
        displayName = conv?.name || otherParticipants.map(pid => profileMap[pid]?.username).filter(Boolean).join(", ")
        avatarUrl = conv?.avatar_url || ""
      } else {
        const otherPid = otherParticipants[0]
        const otherProfile = otherPid ? profileMap[otherPid] : null
        otherUser = otherProfile ? {
          user_id: otherPid,
          username: otherProfile.username,
          avatar_url: otherProfile.avatar_url,
          display_name: otherProfile.display_name,
        } : null
        displayName = otherProfile?.display_name || otherProfile?.username || "Unknown"
        avatarUrl = otherProfile?.avatar_url || ""
      }

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", cid)
        .neq("sender_id", user.id)
        .is("read_at", null)

      const lastMsg = lastMsgMap[cid]
      let lastMsgText = lastMsg?.content || ""
      if (!lastMsgText && lastMsg?.file_name) lastMsgText = "📎 " + lastMsg.file_name
      else if (!lastMsgText && lastMsg?.image_url) lastMsgText = "📷 Image"
      else if (!lastMsgText && lastMsg?.audio_url) lastMsgText = "🎵 Voice note"
      else if (!lastMsgText) lastMsgText = "No messages yet"

      return {
        id: cid,
        is_group: isGroup,
        name: displayName,
        avatar_url: avatarUrl,
        other_user: otherUser,
        participants: isGroup ? otherParticipants.map(pid => ({
          user_id: pid,
          username: profileMap[pid]?.username,
          avatar_url: profileMap[pid]?.avatar_url,
        })) : [],
        last_message: lastMsg ? { content: lastMsgText, created_at: lastMsg.created_at } : null,
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

    const body = await req.json()
    const { participant_ids, participant_id, name } = body

    const allIds = participant_ids || (participant_id ? [participant_id] : [])
    if (allIds.length === 0) return Response.json({ error: "At least one participant required" }, { status: 400 })

    // For 1-on-1, check if existing conversation
    if (allIds.length === 1 && !participant_ids) {
      const targetId = allIds[0]
      const { data: myConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id)

      if (myConvs?.length > 0) {
        const myIds = myConvs.map(c => c.conversation_id)
        const { data: matches } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .in("conversation_id", myIds)
          .eq("user_id", targetId)

        // Find a conversation that's EXACTLY these two users
        for (const match of matches || []) {
          const { count } = await supabase
            .from("conversation_participants")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", match.conversation_id)
          if (count === 2) {
            return Response.json({ conversation_id: match.conversation_id, existing: true })
          }
        }
      }
    }

    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .insert([{ name: name || null }])
      .select()
      .single()

    if (convErr) return Response.json({ error: convErr.message }, { status: 500 })

    const inserts = [{ conversation_id: conv.id, user_id: user.id }]
    allIds.forEach(pid => {
      inserts.push({ conversation_id: conv.id, user_id: pid })
    })

    await supabase.from("conversation_participants").insert(inserts)

    return Response.json({ conversation_id: conv.id, existing: false })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
