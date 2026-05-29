"use client";

import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import MobileNav from "../components/MobileNav";

const guides = [
  {
    id: "basics",
    icon: "📖",
    title: "What is Trading?",
    content: `Trading is buying and selling financial instruments (currencies, stocks, commodities) to profit from price movements. You buy when you think the price will go up, and sell when you think it will go down.

Key markets:
• Forex — Currency pairs like EUR/USD, GBP/USD
• Stocks — Shares of companies like Apple, Tesla
• Indices — Groups of stocks like S&P 500
• Commodities — Gold, oil, silver

As a beginner, start with a demo account (fake money) and practice before risking real capital.`,
  },
  {
    id: "pips",
    icon: "📏",
    title: "What is a Pip?",
    content: `A pip (Percentage in Point) is the smallest price movement in a currency pair.

For most pairs:
• 1 pip = 0.0001 (e.g., EUR/USD moving from 1.1000 to 1.1001)
• For USD/JPY: 1 pip = 0.01

Why it matters: Your profit or loss is measured in pips. If you gain 50 pips on a trade, your actual profit depends on your position size (lot size).

Example: 1 standard lot (100,000 units) = $10 per pip movement.`,
  },
  {
    id: "lots",
    icon: "⚖️",
    title: "Lot Sizes & Position Sizing",
    content: `A lot is the standard unit size of a trade.

Lot sizes:
• Standard lot = 100,000 units ($10/pip)
• Mini lot = 10,000 units ($1/pip)
• Micro lot = 1,000 units ($0.10/pip)
• Nano lot = 100 units ($0.01/pip)

Beginners should start with micro lots to keep risk low. Never risk more than 1-2% of your account on a single trade.`,
  },
  {
    id: "spread",
    icon: "💧",
    title: "Spread & Commissions",
    content: `The spread is the difference between the buy (ask) price and sell (bid) price. It's how your broker makes money.

• Tight spread (1-2 pips) = Low cost, common for major pairs like EUR/USD
• Wide spread (10+ pips) = High cost, common for exotic pairs

Some brokers charge a commission instead of (or in addition to) the spread. Always check costs before trading.

Tip: Trade during high-liquidity sessions (London/New York overlap) for the tightest spreads.`,
  },
  {
    id: "leverage",
    icon: "🔧",
    title: "Leverage & Margin",
    content: `Leverage lets you control a large position with a small amount of capital.

Example: With 1:100 leverage and $1,000, you can control $100,000 (1 standard lot).

Leverage amplifies BOTH profits AND losses.
• 1:10 leverage = Low risk
• 1:100 leverage = Medium risk
• 1:500+ leverage = Very high risk

Rule of thumb: Use low leverage (max 1:30) as a beginner. One bad trade with high leverage can wipe out your account.`,
  },
  {
    id: "risk",
    icon: "🛡️",
    title: "Risk Management",
    content: `The single most important skill in trading. Protect your capital first.

Core rules:
1. Risk 1-2% per trade — never more
2. Always use a Stop Loss (SL) — predefine your exit if the trade goes wrong
3. Use a Take Profit (TP) — know your target before entering
4. Risk-to-Reward ratio (RR) — aim for at least 1:2 (risk $50 to make $100)
5. Don't revenge trade — after a loss, step away

Example: $5,000 account → risk $50-$100 max per trade.
Position size = (Account × Risk%) ÷ Stop Loss (in pips × pip value)`,
  },
  {
    id: "analysis",
    icon: "🔍",
    title: "Technical vs Fundamental Analysis",
    content: `Technical Analysis — Reading price charts and patterns:
• Support & Resistance — Price levels where the market tends to reverse
• Moving Averages — Trend direction (e.g., 50 EMA, 200 EMA)
• RSI — Overbought/oversold indicator
• Candlestick patterns — Doji, engulfing, hammer

Fundamental Analysis — Economic news and events:
• Interest rate decisions (Central banks)
• GDP, employment reports, inflation (CPI)
• Geopolitical events

Most retail traders use technical analysis. Use MatrixVerse to log your trades and see which setups work for you.`,
  },
  {
    id: "propfirms",
    icon: "🏢",
    title: "What are Prop Firms?",
    content: `Proprietary trading firms (prop firms) let you trade their capital after passing an evaluation.

How it works:
1. Pay an evaluation fee (~$50-$500)
2. Pass a two-phase challenge (profit target + no rule breaks)
3. Get a funded account ($10k-$200k)
4. Keep 70-90% of profits you generate

Popular prop firms: FTMO, MFF, The Funded Trader

MatrixVerse has a prop firm comparison tool to help you choose. Start with a small evaluation ($5k-10k) to learn the process.`,
  },
  {
    id: "matrixverse",
    icon: "🚀",
    title: "How to Use MatrixVerse as a Beginner",
    content: `Even with zero experience, MatrixVerse helps you build good habits:

1. Log Paper Trades — Use the Journal tab to record demo trades. Mark them as practice in the notes.

2. Daily Check-ins — Use the Psychology tab to track your emotional state. This builds discipline.

3. Read the Community — See what other traders are doing, their wins and losses. Learn from real experiences.

4. Track Everything — After 20-50 trades, look at your Stats page. See what pairs, sessions, and strategies work for you.

5. Prop Firm Research — Use the Prop Firms page to find evaluation programs when you're ready.

Start today — even paper trading builds the habit. When you're ready for real money, you'll already have a system.`,
  },
];

export default function EducationClient() {
  const [openGuide, setOpenGuide] = useState("basics");

  return (
    <>
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</a>
        <div className="hidden md:flex items-center gap-4">
          <a href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Dashboard</a>
          <ThemeToggle />
        </div>
        <div className="md:hidden"><ThemeToggle /></div>
      </nav>

      <main className="bg-[var(--bg-primary)] min-h-screen px-6 py-8 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">📚 Trading Education</h1>
            <p className="text-[var(--text-muted)] text-sm">Learn the basics — from what a pip is to how prop firms work.</p>
          </div>

          <div className="flex flex-col gap-3">
            {guides.map(g => (
              <div key={g.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenGuide(openGuide === g.id ? null : g.id)}
                  className="w-full flex items-center gap-3 p-5 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <span className="text-2xl">{g.icon}</span>
                  <span className="font-semibold text-[var(--text-primary)] text-sm">{g.title}</span>
                  <span className="ml-auto text-[var(--text-muted)] text-xs">{openGuide === g.id ? "▲" : "▼"}</span>
                </button>
                {openGuide === g.id && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
                      <p className="text-[var(--text-secondary)] text-sm whitespace-pre-line leading-relaxed">{g.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <MobileNav />
    </>
  );
}
