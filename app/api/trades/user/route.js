import { createClient } from "@supabase/supabase-js"

export async function GET(req) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return Response.json({ error: "No auth" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("user_id")
    if (!userId) return Response.json({ error: "Missing user_id" }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("traded_at", { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ trades: trades || [] })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
