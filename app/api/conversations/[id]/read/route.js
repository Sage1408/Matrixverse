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

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", cid)
      .neq("sender_id", user.id)
      .is("read_at", null)

    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
