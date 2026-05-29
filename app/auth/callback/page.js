"use client";

import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        router.push("/login");
        return;
      }

      const user = session.user;
      const username = user.user_metadata?.preferred_username ||
        user.user_metadata?.name?.replace(/\s+/g, "_").toLowerCase() ||
        user.email?.split("@")[0];

      const { data: existing } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        let finalUsername = username;
        let attempts = 0;
        while (attempts < 10) {
          const { data: clash } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", finalUsername)
            .single();
          if (!clash) break;
          finalUsername = username + (attempts + 1);
          attempts++;
        }

        await supabase.from("profiles").insert([{
          user_id: user.id,
          username: finalUsername,
          email: user.email,
          display_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
        }]);

        await supabase.auth.updateUser({
          data: { username: finalUsername },
        });

        router.push("/onboarding");
      } else {
        const currentMeta = user.user_metadata?.username;
        if (currentMeta !== existing.username) {
          await supabase.auth.updateUser({
            data: { username: existing.username },
          });
        }
        router.push("/dashboard");
      }
    };

    handleCallback();
  }, []);

  return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--text-muted)] text-sm">Completing sign in...</p>
      </div>
    </main>
  );
}
