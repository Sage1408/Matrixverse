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

    const url = new URL(req.url)
    const q = url.searchParams.get("q") || ""

    const { data: memberships } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id)

    if (!memberships || memberships.length === 0) return Response.json({ results: [] })

    const ids = memberships.map(m => m.conversation_id)

    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, conversation_id, content, created_at, sender_id")
      .in("conversation_id", ids)
      .ilike("content", "%" + q + "%")
      .order("created_at", { ascending: false })
      .limit(30)

    if (error) return Response.json({ error: error.message }, { status: 500 })

    const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url, display_name")
      .in("user_id", senderIds)

    const profileMap = {}
    profiles?.forEach(p => { profileMap[p.user_id] = p })

    const enriched = messages?.map(m => ({
      ...m,
      sender: profileMap[m.sender_id] || null,
      is_mine: m.sender_id === user.id,
    })) || []

    return Response.json({ results: enriched })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
