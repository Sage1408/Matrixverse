"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    <main className="bg-[#0D1117] min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* LOGO */}
        <div className="text-center mb-8">
          <Link href="/" className="text-[#00D4FF] font-bold text-3xl">
            MatrixVerse
          </Link>
          <p className="text-[#8B949E] text-sm mt-2">
            Welcome back trader 👋
          </p>
        </div>

        {/* CARD */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-8">

          <h1 className="text-white font-bold text-2xl mb-6">Login to Your Account</h1>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">

            {/* EMAIL */}
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

            {/* PASSWORD */}
            <div>
              <label className="text-[#8B949E] text-sm mb-1 block">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0D1117] border border-[#30363D] text-white placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D4FF] transition-colors"
              />
            </div>

            {/* FORGOT PASSWORD */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-[#8B949E] hover:text-[#00D4FF] text-xs transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="bg-[#FF475720] border border-[#FF4757] text-[#FF4757] text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00D4FF] text-[#0D1117] font-bold py-3 rounded-full text-sm hover:bg-[#00b8d9] transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          {/* REGISTER LINK */}
          <p className="text-center text-[#8B949E] text-sm mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#00D4FF] hover:underline">
              Sign up free
            </Link>
          </p>

        </div>

      </div>
    </main>
  );
}
