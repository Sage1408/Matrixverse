"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../lib/animations";
import MarketBackground from "./MarketBackground";

export default function Hero() {
  return (
    <section className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center px-6 pt-24 relative overflow-hidden">
      <MarketBackground />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeInUp} className="inline-block bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent-blue)] text-xs font-semibold px-4 py-2 rounded-full mb-6">
            🚀 The #1 Platform for Serious Traders
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold text-[var(--text-primary)] leading-tight mb-6">
            Track. Improve.{" "}
            <span className="text-[var(--accent-blue)]">Dominate</span>{" "}
            the Markets.
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-[var(--text-muted)] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            MatrixVerse combines a smart trading journal, AI-powered analysis, 
            prop firm tracking, and a trader community — all in one platform.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register" className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-8 py-4 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] hover:scale-105 transition-all duration-200 w-full sm:w-auto text-center">
              Start Journaling Free
            </Link>
            <Link href="#community" className="border border-[var(--border)] text-[var(--text-secondary)] font-semibold px-8 py-4 rounded-full text-sm hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] hover:scale-105 transition-all duration-200 w-full sm:w-auto text-center">
              Join the Community
            </Link>
          </motion.div>

          <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">12,400+</div>
              <div className="text-[var(--text-muted)] text-xs mt-1">Active Traders</div>
            </div>
            <div className="text-center border-x border-[var(--border)]">
              <div className="text-2xl font-bold text-[var(--text-primary)]">980K+</div>
              <div className="text-[var(--text-muted)] text-xs mt-1">Trades Logged</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--accent-green)]">68%</div>
              <div className="text-[var(--text-muted)] text-xs mt-1">Avg Win Rate</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
