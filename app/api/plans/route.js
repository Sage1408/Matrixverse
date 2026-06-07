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

    const { data: plans, error } = await supabase
      .from("trade_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return Response.json({ success: true, plans })
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

    if (body.is_active) {
      await supabase
        .from("trade_plans")
        .update({ is_active: false })
        .eq("user_id", user.id)
    }

    if (body.id) {
      const { error } = await supabase
        .from("trade_plans")
        .update({
          name: body.name,
          pair: body.pair,
          direction: body.direction,
          entry_criteria: body.entry_criteria,
          stop_loss_plan: body.stop_loss_plan,
          take_profit_plan: body.take_profit_plan,
          invalidation: body.invalidation,
          management_notes: body.management_notes,
          is_active: body.is_active || false,
        })
        .eq("id", body.id)
        .eq("user_id", user.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from("trade_plans")
        .insert([{
          user_id: user.id,
          name: body.name,
          pair: body.pair,
          direction: body.direction,
          entry_criteria: body.entry_criteria,
          stop_loss_plan: body.stop_loss_plan,
          take_profit_plan: body.take_profit_plan,
          invalidation: body.invalidation,
          management_notes: body.management_notes,
          is_active: body.is_active || false,
        }])

      if (error) throw error
    }

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return Response.json({ error: "No auth" }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

    const { error } = await supabase
      .from("trade_plans")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
