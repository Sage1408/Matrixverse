"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-[#0D1117] min-h-screen flex items-center justify-center px-6 pt-24">
      <div className="max-w-4xl mx-auto text-center">

        {/* BADGE */}
        <div className="inline-block bg-[#161B22] border border-[#30363D] text-[#00D4FF] text-xs font-semibold px-4 py-2 rounded-full mb-6">
          🚀 The #1 Platform for Serious Traders
        </div>

        {/* HEADLINE */}
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
          Track. Improve.{" "}
          <span className="text-[#00D4FF]">Dominate</span>{" "}
          the Markets.
        </h1>

        {/* SUBHEADLINE */}
        <p className="text-[#8B949E] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          MatrixVerse combines a smart trading journal, AI-powered analysis, 
          prop firm tracking, and a trader community — all in one platform.
        </p>

        {/* BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/register" className="bg-[#00D4FF] text-[#0D1117] font-bold px-8 py-4 rounded-full text-sm hover:bg-[#00b8d9] transition-colors duration-200 w-full sm:w-auto text-center">
            Start Journaling Free
          </Link>
          <Link href="#community" className="border border-[#30363D] text-[#C9D1D9] font-semibold px-8 py-4 rounded-full text-sm hover:border-[#00D4FF] hover:text-[#00D4FF] transition-colors duration-200 w-full sm:w-auto text-center">
            Join the Community
          </Link>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">12,400+</div>
            <div className="text-[#8B949E] text-xs mt-1">Active Traders</div>
          </div>
          <div className="text-center border-x border-[#30363D]">
            <div className="text-2xl font-bold text-white">980K+</div>
            <div className="text-[#8B949E] text-xs mt-1">Trades Logged</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00FF88]">68%</div>
            <div className="text-[#8B949E] text-xs mt-1">Avg Win Rate</div>
          </div>
        </div>

      </div>
    </section>
  );
}