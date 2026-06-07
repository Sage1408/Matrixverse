import { createClient } from "@supabase/supabase-js"

export async function GET(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("user_id")

    let user = null
    if (!userId) {
      const authHeader = req.headers.get("Authorization")
      if (authHeader) {
        const { data: { user: u } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
        user = u
      }
    }

    const targetUserId = userId || user?.id
    if (!targetUserId) return Response.json({ error: "Missing user" }, { status: 400 })

    const { data: badges } = await supabase.rpc("get_user_badges", { p_user_id: targetUserId })
    const { data: allBadges } = await supabase.from("badges").select("*").order("id")

    return Response.json({ earned: badges || [], all: allBadges || [] })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
