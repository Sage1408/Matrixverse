"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";

const PUBLIC_VAPID_KEY = "BPg0H1c46b_iRvZUtBcTibZ0GaY3y5cYXO8y-c94HuTismDtjloRjIKBZwbLpmqiH1ppGT-wTtcduvC6g9B_1PY";

export default function PushProvider({ children }) {
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "denied") return;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        if (existing) return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: PUBLIC_VAPID_KEY,
        });

        await fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            subscription,
          }),
        });
      } catch (e) {
        // silently fail — push is a nice-to-have
      }
    };

    init();
  }, []);

  return children;
}
