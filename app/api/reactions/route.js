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
    const messageIds = url.searchParams.get("ids")?.split(",") || []

    if (messageIds.length === 0) return Response.json({ reactions: {} })

    const { data: reactions } = await supabase
      .from("message_reactions")
      .select("id, message_id, user_id, emoji")
      .in("message_id", messageIds.map(Number))

    const grouped = {}
    reactions?.forEach(r => {
      if (!grouped[r.message_id]) grouped[r.message_id] = []
      grouped[r.message_id].push(r)
    })

    return Response.json({ reactions: grouped })
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

    const { message_id, emoji } = await req.json()
    if (!message_id || !emoji) return Response.json({ error: "message_id and emoji required" }, { status: 400 })

    const { data: existing } = await supabase
      .from("message_reactions")
      .select("id")
      .eq("message_id", message_id)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .single()

    if (existing) {
      await supabase.from("message_reactions").delete().eq("id", existing.id)
      return Response.json({ action: "removed" })
    }

    await supabase.from("message_reactions").insert([{
      message_id,
      user_id: user.id,
      emoji,
    }])

    return Response.json({ action: "added" })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
