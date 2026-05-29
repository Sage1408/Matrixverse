import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return Response.json({ error: "Missing user_id" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const tables = [
      "trades", "posts", "comments", "likes", "follows",
      "checkins", "notifications", "push_subscriptions",
    ];
    for (const table of tables) {
      await supabase.from(table).delete().eq("user_id", String(user_id));
    }

    await supabase.from("profiles").delete().eq("user_id", String(user_id));

    const { error } = await supabase.auth.admin.deleteUser(user_id);
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
