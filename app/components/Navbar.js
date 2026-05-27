"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { slideDown } from "../lib/animations";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.nav
      variants={slideDown}
      initial="hidden"
      animate="visible"
      className="fixed top-0 left-0 w-full z-50 bg-[#0D1117]/80 backdrop-blur-md border-b border-[#30363D]"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* LOGO */}
        <div className="text-[#00D4FF] font-bold text-2xl tracking-wider">
          MatrixVerse
        </div>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-[#8B949E] hover:text-white transition-colors duration-200 text-sm">
            Features
          </Link>
          <Link href="#pricing" className="text-[#8B949E] hover:text-white transition-colors duration-200 text-sm">
            Pricing
          </Link>
          <Link href="#community" className="text-[#8B949E] hover:text-white transition-colors duration-200 text-sm">
            Community
          </Link>
          <Link href="#faq" className="text-[#8B949E] hover:text-white transition-colors duration-200 text-sm">
            FAQ
          </Link>
        </div>

        {/* DESKTOP BUTTONS */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-[#C9D1D9] hover:text-white text-sm transition-colors duration-200">
            Login
          </Link>
          <Link href="/register" className="bg-[#00D4FF] text-[#0D1117] font-semibold text-sm px-5 py-2 rounded-full hover:bg-[#00b8d9] transition-colors duration-200">
            Sign Up Free
          </Link>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
  className="md:hidden text-[#8B949E] hover:text-white p-2"
  onClick={() => setMenuOpen(!menuOpen)}
  style={{ WebkitTapHighlightColor: "transparent" }}
>
  {menuOpen ? "✕" : "☰"}
</button>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {menuOpen && (
        <div className="md:hidden bg-[#161B22] border-t border-[#30363D] px-6 py-4 flex flex-col gap-4">
          <Link href="#features" className="text-[#8B949E] hover:text-white text-sm" onClick={() => setMenuOpen(false)}>
            Features
          </Link>
          <Link href="#pricing" className="text-[#8B949E] hover:text-white text-sm" onClick={() => setMenuOpen(false)}>
            Pricing
          </Link>
          <Link href="#community" className="text-[#8B949E] hover:text-white text-sm" onClick={() => setMenuOpen(false)}>
            Community
          </Link>
          <Link href="#faq" className="text-[#8B949E] hover:text-white text-sm" onClick={() => setMenuOpen(false)}>
            FAQ
          </Link>
          <hr className="border-[#30363D]" />
          <Link href="/login" className="text-[#C9D1D9] hover:text-white text-sm">
            Login
          </Link>
          <Link href="/register" className="bg-[#00D4FF] text-[#0D1117] font-semibold text-sm px-5 py-2 rounded-full text-center hover:bg-[#00b8d9]">
            Sign Up Free
          </Link>
        </div>
      )}
    </motion.nav>
  );
}
