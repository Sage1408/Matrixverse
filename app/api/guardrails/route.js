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

    const { data: profile } = await supabase
      .from("profiles")
      .select("guardrails")
      .eq("user_id", user.id)
      .single()

    return Response.json({ success: true, guardrails: profile?.guardrails || null })
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

    const { error } = await supabase
      .from("profiles")
      .update({ guardrails: body })
      .eq("user_id", user.id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
