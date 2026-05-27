"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

export default function RegisterClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      // Save to profiles table so other users can find this account
      await supabase.from("profiles").insert([{
        user_id: data.user?.id,
        username: username,
        email: email,
      }]);
      setMessage("Account created! Check your email to confirm your account.");
    }

    setLoading(false);
  };

  return (
    <main className="bg-[#0D1117] min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="text-[#00D4FF] font-bold text-3xl">
            MatrixVerse
          </Link>
          <p className="text-[#8B949E] text-sm mt-2">
            Create your free trading account
          </p>
        </div>

        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-8">

          <h1 className="text-white font-bold text-2xl mb-6">Get Started Free</h1>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">

            <div>
              <label className="text-[#8B949E] text-sm mb-1 block">Username</label>
              <input
                type="text"
                placeholder="e.g. tunde_fx"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#0D1117] border border-[#30363D] text-white placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D4FF] transition-colors"
              />
            </div>

            <div>
              <label className="text-[#8B949E] text-sm mb-1 block">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0D1117] border border-[#30363D] text-white placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D4FF] transition-colors"
              />
            </div>

            <div>
              <label className="text-[#8B949E] text-sm mb-1 block">Password</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0D1117] border border-[#30363D] text-white placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D4FF] transition-colors"
              />
            </div>

            {error && (
              <div className="bg-[#FF475720] border border-[#FF4757] text-[#FF4757] text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-[#00FF8820] border border-[#00FF88] text-[#00FF88] text-sm px-4 py-3 rounded-xl">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00D4FF] text-[#0D1117] font-bold py-3 rounded-full text-sm hover:bg-[#00b8d9] transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Free Account"}
            </button>

          </form>

          <p className="text-center text-[#8B949E] text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#00D4FF] hover:underline">
              Login here
            </Link>
          </p>

        </div>

      </div>
    </main>
  );
}
