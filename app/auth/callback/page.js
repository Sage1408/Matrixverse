"use client";

import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        router.push("/login");
        return;
      }

      const user = session.user;
      const username = user.user_metadata?.full_name?.replace(/\s+/g, "_").toLowerCase()
        || user.email?.split("@")[0]
        || "user_" + user.id.slice(0, 8);

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        await supabase.from("profiles").insert([{
          user_id: user.id,
          username,
          email: user.email,
        }]);
        await supabase.auth.updateUser({
          data: { username },
        });
      }

      const { data: { user: updated } } = await supabase.auth.getUser();
      if (updated?.user_metadata?.onboarded) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    };

    handleAuth();
  }, []);

  return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-muted)] text-sm">Signing you in...</p>
      </div>
    </main>
  );
}
