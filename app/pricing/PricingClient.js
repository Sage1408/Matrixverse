"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import ThemeToggle from "../components/ThemeToggle"

export default function PricingClient() {
  const [user, setUser] = useState(null);
  const [billing, setBilling] = useState("monthly");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);
    };
    init();
  }, []);

  const free = [
    "Trading journal — up to 50 trades/month",
    "Community feed — read and post",
    "Public trader profile",
    "Basic win rate and PnL stats",
    "Leaderboard — view only",
    "1 prop firm recommendation",
    "Psychology mood tracker",
    "Search traders",
  ];

  const premium = [
    "Unlimited trade journal entries",
    "AI trade analyzer — unlimited",
    "Full psychology weekly reports",
    "Advanced stats by pair, session, strategy",
    "Full leaderboard participation",
    "All prop firm recommendations",
    "Unlimited screenshot uploads",
    "CSV, Excel and PDF export",
    "Notification system",
    "Priority support",
  ];

  const faqs = [
    {
      q: "Can I cancel anytime?",
      a: "Yes. Cancel anytime from your settings page. You keep premium access until the end of your billing period.",
    },
    {
      q: "Is there a free trial?",
      a: "Yes! Premium comes with a 7-day free trial. No credit card required to start.",
    },
    {
      q: "Which payment methods are accepted?",
      a: "We accept all major credit cards via Stripe. Nigerian and African users can also pay via Paystack.",
    },
    {
      q: "What happens to my data if I downgrade?",
      a: "Your data is always safe. If you downgrade, you keep all your logged trades but lose access to premium features.",
    },
  ];

  const monthlyPrice = 19;
  const yearlyPrice = 149;
  const yearlySavings = Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100);

  return (
    <main className="bg-[var(--bg-primary)] min-h-screen">

      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</a>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <a href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Dashboard</a>
          ) : (
            <>
              <a href="/login" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Login</a>
              <a href="/register" className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-4 py-2 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors">
                Sign Up Free
              </a>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="inline-block bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent-blue)] text-xs font-semibold px-4 py-2 rounded-full mb-4">
            💎 Simple Pricing
          </div>
          <h1 className="text-[var(--text-primary)] font-bold text-4xl md:text-5xl mb-4">
            Start Free. Upgrade When Ready.
          </h1>
          <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
            No hidden fees. Cancel anytime. Built for traders at every level.
          </p>
        </div>

        {/* BILLING TOGGLE */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setBilling("monthly")}
            className={"text-sm font-semibold transition-colors " + (billing === "monthly" ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
            className={"w-12 h-6 rounded-full relative transition-colors " + (billing === "yearly" ? "bg-[var(--accent-blue)]" : "bg-[var(--border)]")}
          >
            <div className={"w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all " + (billing === "yearly" ? "left-6" : "left-0.5")} />
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={"text-sm font-semibold transition-colors " + (billing === "yearly" ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}
          >
            Yearly
            <span className="ml-2 bg-[var(--accent-green-bg)] text-[var(--accent-green)] text-xs font-bold px-2 py-0.5 rounded-full border border-[var(--accent-green-border)]">
              Save {yearlySavings}%
            </span>
          </button>
        </div>

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">

          {/* FREE PLAN */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <div className="text-[var(--text-muted)] text-sm font-semibold mb-2">FREE PLAN</div>
              <div className="text-5xl font-bold text-[var(--text-primary)] mb-1">$0</div>
              <div className="text-[var(--text-muted)] text-sm">Forever free. No credit card needed.</div>
            </div>

            <div className="flex flex-col gap-3 flex-1 mb-8">
              {free.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[var(--accent-green)] flex-shrink-0 mt-0.5">✓</span>
                  <span className="text-[var(--text-secondary)] text-sm">{item}</span>
                </div>
              ))}
            </div>

            <a
              href={user ? "/dashboard" : "/register"}
              className="w-full border border-[var(--border)] text-[var(--text-primary)] font-semibold py-3 rounded-full text-sm text-center hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors block"
            >
              {user ? "You are on Free Plan" : "Get Started Free"}
            </a>
          </div>

          {/* PREMIUM PLAN */}
          <div className="bg-[var(--bg-secondary)] border-2 border-[var(--accent-blue)] rounded-2xl p-8 flex flex-col relative">

            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--accent-blue)] text-[var(--bg-primary)] text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
              MOST POPULAR
            </div>

            <div className="mb-6">
              <div className="text-[var(--accent-blue)] text-sm font-semibold mb-2">PREMIUM PLAN</div>
              <div className="flex items-end gap-2 mb-1">
                <div className="text-5xl font-bold text-[var(--text-primary)]">
                  ${billing === "monthly" ? monthlyPrice : Math.round(yearlyPrice / 12)}
                </div>
                <div className="text-[var(--text-muted)] text-sm mb-2">/month</div>
              </div>
              {billing === "yearly" ? (
                <div className="text-[var(--accent-green)] text-sm font-semibold">
                  ${yearlyPrice}/year — save ${monthlyPrice * 12 - yearlyPrice}
                </div>
              ) : (
                <div className="text-[var(--text-muted)] text-sm">
                  Or ${yearlyPrice}/year — save {yearlySavings}%
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 flex-1 mb-8">
              {premium.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[var(--accent-blue)] flex-shrink-0 mt-0.5">✓</span>
                  <span className="text-[var(--text-secondary)] text-sm">{item}</span>
                </div>
              ))}
            </div>

            <a
              href={user ? "/settings" : "/register"}
              className="w-full bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm text-center hover:bg-[var(--accent-blue-hover)] transition-colors block"
            >
              Start 7-Day Free Trial
            </a>
          </div>

        </div>

        {/* PAYMENT METHODS */}
        <div className="text-center mb-16">
          <p className="text-[var(--text-muted)] text-sm mb-4">
            🔒 Secure payments via Stripe and Paystack. Cancel anytime.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {["Visa", "Mastercard", "Stripe", "Paystack", "Bank Transfer"].map((method, i) => (
              <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] text-xs font-semibold px-4 py-2 rounded-xl">
                {method}
              </div>
            ))}
          </div>
        </div>

        {/* FEATURE COMPARISON TABLE */}
        <div className="mb-16">
          <h2 className="text-[var(--text-primary)] font-bold text-2xl text-center mb-8">Full Feature Comparison</h2>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-[var(--accent-purple)] px-6 py-3">
              <div className="text-[var(--text-primary)] font-bold text-sm">Feature</div>
              <div className="text-[var(--text-primary)] font-bold text-sm text-center">Free</div>
              <div className="text-[var(--text-primary)] font-bold text-sm text-center">Premium</div>
            </div>
            {[
              ["Trading Journal", "50 trades/month", "Unlimited"],
              ["Screenshot Uploads", "5/month", "Unlimited"],
              ["AI Trade Analyzer", "❌", "✅ Unlimited"],
              ["Psychology Reports", "Basic", "Full AI Reports"],
              ["Community Feed", "✅", "✅"],
              ["Leaderboard", "View only", "Full participation"],
              ["Prop Firm Recommendations", "3 firms", "All firms"],
              ["Advanced Stats", "Basic", "Full breakdown"],
              ["CSV / Excel / PDF Export", "❌", "✅"],
              ["Notifications", "❌", "✅"],
              ["Priority Support", "❌", "✅"],
              ["Search Traders", "✅", "✅"],
            ].map(([feature, free, premium], i) => (
              <div
                key={i}
                className={"grid grid-cols-3 px-6 py-4 border-b border-[var(--border)] " + (i % 2 === 0 ? "bg-[var(--bg-secondary)]" : "bg-[var(--bg-tertiary)]")}
              >
                <div className="text-[var(--text-secondary)] text-sm">{feature}</div>
                <div className={"text-sm text-center " + (free === "❌" ? "text-[var(--accent-red)]" : "text-[var(--text-muted)]")}>{free}</div>
                <div className={"text-sm text-center font-semibold " + (premium.startsWith("✅") || premium === "Unlimited" || premium === "Full" ? "text-[var(--accent-green)]" : "text-[var(--accent-blue)]")}>{premium}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-[var(--text-primary)] font-bold text-2xl text-center mb-8">Frequently Asked Questions</h2>
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                <h3 className="text-[var(--text-primary)] font-semibold text-sm mb-2">{faq.q}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-10 text-center">
          <h2 className="text-[var(--text-primary)] font-bold text-2xl mb-3">Ready to level up your trading?</h2>
          <p className="text-[var(--text-muted)] text-sm mb-6">Join thousands of traders already using MatrixVerse.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href={user ? "/dashboard" : "/register"}
              className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-8 py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors"
            >
              Start Free Today
            </a>
            <a
              href={user ? "/settings" : "/register"}
              className="border border-[var(--border)] text-[var(--text-primary)] font-semibold px-8 py-3 rounded-full text-sm hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors"
            >
              Try Premium Free
            </a>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)] px-6 py-8 text-center">
        <p className="text-[var(--text-muted)] text-sm">
          © 2025 MatrixVerse. All rights reserved. Built for traders. By traders. 🚀
        </p>
      </footer>

    </main>
  );
}
