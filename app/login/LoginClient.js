"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle"

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
if (user?.user_metadata?.onboarded) {
  router.push("/dashboard");
} else {
  router.push("/onboarding");
}
    }

    setLoading(false);
  };

  return (
    <>
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</Link>
        <ThemeToggle />
      </nav>
      <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">

        {/* LOGO */}
        <div className="text-center mb-8">
          <Link href="/" className="text-[var(--accent-blue)] font-bold text-3xl">
            MatrixVerse
          </Link>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            Welcome back trader 👋
          </p>
        </div>

        {/* CARD */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8">

          <h1 className="text-[var(--text-primary)] font-bold text-2xl mb-6">Login to Your Account</h1>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">

            {/* EMAIL */}
            <div>
              <label className="text-[var(--text-muted)] text-sm mb-1 block">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-[var(--text-muted)] text-sm mb-1 block">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>

            {/* FORGOT PASSWORD */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] text-xs transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)] text-[var(--accent-red)] text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          {/* REGISTER LINK */}
          <p className="text-center text-[var(--text-muted)] text-sm mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-[var(--accent-blue)] hover:underline">
              Sign up free
          </Link>
          </p>
        </div>
      </div>
    </main>
    </>
  );
}
