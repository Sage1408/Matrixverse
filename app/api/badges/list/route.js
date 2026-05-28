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

    const { data: badges } = await supabase.rpc("get_user_badges", { p_user_id: user.id })
    const { data: allBadges } = await supabase.from("badges").select("*").order("id")

    return Response.json({ earned: badges || [], all: allBadges || [] })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
