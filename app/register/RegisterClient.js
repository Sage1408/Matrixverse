"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import ThemeToggle from "../components/ThemeToggle"
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
    <>
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</Link>
        <ThemeToggle />
      </nav>
      <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="text-[var(--accent-blue)] font-bold text-3xl">
            MatrixVerse
          </Link>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            Create your free trading account
          </p>
        </div>
      </div>
    </main>
    </>
  );
}
