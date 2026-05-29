"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { slideDown } from "../lib/animations";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.nav
      variants={slideDown}
      initial="hidden"
      animate="visible"
      className="fixed top-0 left-0 w-full z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)]"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* LOGO */}
        <div className="text-[var(--accent-blue)] font-bold text-2xl tracking-wider">
          MatrixVerse
        </div>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 text-sm">
            Features
          </Link>
          <Link href="#pricing" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 text-sm">
            Pricing
          </Link>
          <Link href="#community" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 text-sm">
            Community
          </Link>
          <Link href="#faq" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 text-sm">
            FAQ
          </Link>
          <Link href="/education" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 text-sm">
            Learn
          </Link>
        </div>

        {/* DESKTOP BUTTONS */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors duration-200">
            Login
          </Link>
          <Link href="/register" className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-semibold text-sm px-5 py-2 rounded-full hover:bg-[var(--accent-blue-hover)] transition-colors duration-200">
            Sign Up Free
          </Link>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
  className="md:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2"
  onClick={() => setMenuOpen(!menuOpen)}
  style={{ WebkitTapHighlightColor: "transparent" }}
>
  {menuOpen ? "✕" : "☰"}
</button>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {menuOpen && (
        <div className="md:hidden bg-[var(--bg-secondary)] border-t border-[var(--border)] px-6 py-4 flex flex-col gap-4">
          <Link href="#features" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm" onClick={() => setMenuOpen(false)}>
            Features
          </Link>
          <Link href="#pricing" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm" onClick={() => setMenuOpen(false)}>
            Pricing
          </Link>
          <Link href="#community" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm" onClick={() => setMenuOpen(false)}>
            Community
          </Link>
          <Link href="#faq" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm" onClick={() => setMenuOpen(false)}>
            FAQ
          </Link>
          <hr className="border-[var(--border)]" />
          <Link href="/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm">
            Login
          </Link>
          <Link href="/register" className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-semibold text-sm px-5 py-2 rounded-full text-center hover:bg-[var(--accent-blue-hover)]">
            Sign Up Free
          </Link>
        </div>
      )}
    </motion.nav>
  );
}
