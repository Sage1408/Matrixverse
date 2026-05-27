import { createClient } from "@supabase/supabase-js";

const webpush = require("web-push");

webpush.setVapidDetails(
  "mailto:sage@matrixverse.app",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(req) {
  try {
    const { user_id, title, body, url } = await req.json();

    if (!user_id) {
      return Response.json({ error: "Missing user_id" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", String(user_id));

    if (!subscriptions || subscriptions.length === 0) {
      return Response.json({ sent: 0 });
    }

    const payload = JSON.stringify({ title, body, url });

    let sent = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { auth: sub.auth_key, p256dh: sub.p256dh_key },
        }, payload);
        sent++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }

    return Response.json({ sent });
  } catch (e) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
