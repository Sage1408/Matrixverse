"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import ThemeToggle from "../components/ThemeToggle"
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      await supabase.from("profiles").insert([{
        user_id: data.user?.id,
        username: username,
        email: email,
      }]);
      setMessage("Account created! Check your email to confirm your account.");
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (error) setError(error.message);
  };

  return (
    <>
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</Link>
        <ThemeToggle />
      </nav>
      <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <Link href="/" className="text-[var(--accent-blue)] font-bold text-3xl">MatrixVerse</Link>
            <p className="text-[var(--text-muted)] text-sm mt-2">Create your free trading account</p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8">

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 rounded-full text-sm transition-colors mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[var(--text-muted)] text-xs">or sign up with email</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="text-[var(--text-muted)] text-sm mb-1 block">Username</label>
                <input
                  type="text"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                />
              </div>
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
              <div>
                <label className="text-[var(--text-muted)] text-sm mb-1 block">Password</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                />
              </div>

              {message && (
                <div className="bg-[var(--accent-green-bg)] border border-[var(--accent-green)] text-[var(--accent-green)] text-sm px-4 py-3 rounded-xl">{message}</div>
              )}
              {error && (
                <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)] text-[var(--accent-red)] text-sm px-4 py-3 rounded-xl">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="text-center text-[var(--text-muted)] text-sm mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--accent-blue)] hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
