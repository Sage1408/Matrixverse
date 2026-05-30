import { createClient } from "@supabase/supabase-js"

export async function POST(req, { params }) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return Response.json({ error: "No auth" }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const cid = (await params).id

    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", cid)
      .eq("user_id", user.id)
      .single()

    if (!participant) return Response.json({ error: "Not a participant" }, { status: 403 })

    const { user_id } = await req.json()
    if (!user_id) return Response.json({ error: "user_id required" }, { status: 400 })

    const { error: insertErr } = await supabase
      .from("conversation_participants")
      .insert([{ conversation_id: cid, user_id }])

    if (insertErr) {
      if (insertErr.code === "23505") return Response.json({ error: "Already a participant" }, { status: 409 })
      return Response.json({ error: insertErr.message }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
