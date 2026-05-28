import { createClient } from "@supabase/supabase-js"

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

    const { data: newBadges } = await supabase.rpc("check_and_award_badges", { p_user_id: user.id })
    
    return Response.json({ badges: newBadges || [] })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
