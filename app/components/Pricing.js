"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { fadeInUp, staggerContainer, rotate3d } from "../lib/animations";
import TiltCard from "./TiltCard";

export default function Pricing() {
  const { scrollY } = useScroll()
  const bgY = useTransform(scrollY, [0, 500], [0, 100])

  const free = [
    "Trading journal — up to 50 trades/month",
    "Community feed — read and post",
    "Public trader profile",
    "Basic win rate and PnL stats",
    "1 active prop firm recommendation",
    "Leaderboard — view only",
  ];

  const premium = [
    "Unlimited trade journal entries",
    "AI trade analyzer — unlimited",
    "Full psychology weekly reports",
    "Advanced stats by pair, session, strategy",
    "Unlimited prop firm recommendations",
    "Full leaderboard participation",
    "Unlimited screenshot uploads",
    "CSV export of all trade data",
    "Priority support",
  ];

  return (
    <section id="pricing" className="bg-[var(--bg-primary)] py-24 px-6 scroll-mt-24 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y: bgY }}
      />
      <div className="max-w-5xl mx-auto relative z-10">

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.div variants={fadeInUp} className="inline-block bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent-blue)] text-xs font-semibold px-4 py-2 rounded-full mb-4">
            💎 Simple Pricing
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
            Start Free. Upgrade When Ready.
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
            No hidden fees. Cancel anytime. Built for traders at every level.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          <TiltCard>
            <motion.div
              variants={rotate3d}
              whileHover={{ scale: 1.02 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8 flex flex-col"
            >
              <div className="mb-6">
                <div className="text-[var(--text-muted)] text-sm font-semibold mb-2">FREE PLAN</div>
                <div className="text-4xl font-bold text-[var(--text-primary)] mb-1">$0</div>
                <div className="text-[var(--text-muted)] text-sm">Forever free. No credit card needed.</div>
              </div>

              <div className="flex flex-col gap-3 flex-1 mb-8">
                {free.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-[var(--accent-green)] mt-0.5">✓</span>
                    <span className="text-[var(--text-secondary)] text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <a href="/register" className="w-full border border-[var(--border)] text-[var(--text-primary)] font-semibold py-3 rounded-full text-sm text-center hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] hover:scale-105 transition-all duration-200">
                Get Started Free
              </a>
            </motion.div>
          </TiltCard>

          <TiltCard>
            <motion.div
              variants={rotate3d}
              whileHover={{ scale: 1.02 }}
              className="bg-[var(--bg-secondary)] border-2 border-[var(--accent-blue)] rounded-2xl p-8 flex flex-col relative"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--accent-blue)] text-[var(--bg-primary)] text-xs font-bold px-4 py-1.5 rounded-full">
                MOST POPULAR
              </div>

              <div className="mb-6">
                <div className="text-[var(--accent-blue)] text-sm font-semibold mb-2">PREMIUM PLAN</div>
                <div className="flex items-end gap-2 mb-1">
                  <div className="text-4xl font-bold text-[var(--text-primary)]">$19</div>
                  <div className="text-[var(--text-muted)] text-sm mb-1">/month</div>
                </div>
                <div className="text-[var(--text-muted)] text-sm">Or $149/year — save 35%</div>
              </div>

              <div className="flex flex-col gap-3 flex-1 mb-8">
                {premium.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-[var(--accent-blue)] mt-0.5">✓</span>
                    <span className="text-[var(--text-secondary)] text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <a href="/register" className="w-full bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm text-center hover:bg-[var(--accent-blue-hover)] hover:scale-105 transition-all duration-200">
                Start 7-Day Free Trial
              </a>
            </motion.div>
          </TiltCard>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center text-[var(--text-muted)] text-sm mt-8"
        >
          🔒 Secure payments via Stripe and Paystack. Cancel anytime.
        </motion.p>

      </div>
    </section>
  );
}
