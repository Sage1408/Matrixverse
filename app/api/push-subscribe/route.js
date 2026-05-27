import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { user_id, subscription } = await req.json();

    if (!user_id || !subscription) {
      return Response.json({ error: "Missing user_id or subscription" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: String(user_id),
        endpoint: subscription.endpoint,
        auth_key: subscription.keys?.auth || "",
        p256dh_key: subscription.keys?.p256dh || "",
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
