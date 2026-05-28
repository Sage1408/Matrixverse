"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainerFast } from "../lib/animations";

export default function Features() {
  const features = [
    {
      icon: "📓",
      title: "Smart Trading Journal",
      description: "Log every trade with entry, SL, TP, emotions, and screenshots. Track your performance automatically.",
      color: "#00D4FF",
    },
    {
      icon: "🤖",
      title: "AI Trade Analyzer",
      description: "Get instant AI feedback on your trades. Detect emotional mistakes, bad RR, and overtrading patterns.",
      color: "#7C3AED",
    },
    {
      icon: "👥",
      title: "Trader Community",
      description: "Share setups, follow top traders, post analysis, and grow your trading network in one place.",
      color: "#00FF88",
    },
    {
      icon: "🏆",
      title: "Leaderboards",
      description: "Compete with traders worldwide. Climb the ranks by win rate, RR ratio, streak, and consistency.",
      color: "#FFD700",
    },
    {
      icon: "🎯",
      title: "Prop Firm Tracker",
      description: "Track your FTMO, FundedNext, and other prop challenges. Get alerts before hitting drawdown limits.",
      color: "#FF6B35",
    },
    {
      icon: "🧠",
      title: "Psychology Tracker",
      description: "Monitor your emotions daily. Detect revenge trading, fear, greed, and build mental consistency.",
      color: "#FF4757",
    },
  ];

  return (
    <section id="features" className="bg-[var(--bg-primary)] py-24 px-6 scroll-mt-24">
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainerFast}
          className="text-center mb-16"
        >
          <motion.div variants={fadeInUp} className="inline-block bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent-blue)] text-xs font-semibold px-4 py-2 rounded-full mb-4">
            ⚡ Everything You Need
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
            Built for Serious Traders
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
            Every tool you need to become a consistently profitable trader — in one powerful platform.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainerFast}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ scale: 1.03, borderColor: feature.color, boxShadow: `0 0 30px ${feature.color}20` }}
              className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 transition-colors duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: feature.color }}
              >
                {feature.title}
              </h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}