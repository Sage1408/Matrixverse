"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle"

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    if (error) setError(error.message);
    else setSent(true);
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
          <div className="text-center mb-8">
            <Link href="/" className="text-[var(--accent-blue)] font-bold text-3xl">MatrixVerse</Link>
            <p className="text-[var(--text-muted)] text-sm mt-2">Reset your password</p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8">
            {sent ? (
              <div className="text-center">
                <div className="text-4xl mb-3">📬</div>
                <p className="text-[var(--text-primary)] font-semibold mb-1">Check your email</p>
                <p className="text-[var(--text-muted)] text-sm mb-6">
                  If an account exists with <strong>{email}</strong>, you'll receive a password reset link.
                </p>
                <Link href="/login" className="text-[var(--accent-blue)] text-sm hover:underline">
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <p className="text-[var(--text-muted)] text-sm mb-2">
                  Enter your email and we'll send you a reset link.
                </p>
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

                {error && (
                  <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)] text-[var(--accent-red)] text-sm px-4 py-3 rounded-xl">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>

                <p className="text-center text-[var(--text-muted)] text-sm mt-2">
                  <Link href="/login" className="text-[var(--accent-blue)] hover:underline">Back to Login</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
