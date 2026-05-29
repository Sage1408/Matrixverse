"use client";

import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import MobileNav from "../components/MobileNav";

const terms = [
  { term: "Ask Price", definition: "The lowest price a seller is willing to accept for a currency pair. You buy at the ask price." },
  { term: "Bid Price", definition: "The highest price a buyer is willing to pay for a currency pair. You sell at the bid price." },
  { term: "Spread", definition: "The difference between the ask price and the bid price. This is the cost of opening a trade, paid to your broker." },
  { term: "Pip", definition: "Percentage in Point — the smallest price movement in a currency pair. For most pairs, 1 pip = 0.0001. For JPY pairs, 1 pip = 0.01." },
  { term: "Lot", definition: "A standardized unit size for trades. Standard lot = 100,000 units, Mini lot = 10,000, Micro lot = 1,000, Nano lot = 100." },
  { term: "Leverage", definition: "Borrowed capital from your broker that allows you to control a larger position with less money. E.g., 1:100 leverage means $1,000 controls $100,000. Amplifies both profits and losses." },
  { term: "Margin", definition: "The amount of money required in your account to open a leveraged trade. If margin runs out, your broker will close your position (margin call)." },
  { term: "Stop Loss (SL)", definition: "An order to automatically close a trade at a predetermined price to limit losses. Essential for risk management — always use one." },
  { term: "Take Profit (TP)", definition: "An order to automatically close a trade at a predetermined price to lock in profits." },
  { term: "Risk-to-Reward Ratio (R:R)", definition: "The ratio of potential profit to potential loss on a trade. A 1:2 R:R means you risk $1 to make $2. Aim for at least 1:2." },
  { term: "Drawdown", definition: "The decline in your trading account from its peak. A 20% drawdown means you lost 20% of your peak account value." },
  { term: "Margin Call", definition: "When your account equity falls below the required margin level, your broker will close your open positions to prevent further losses." },
  { term: "Support and Resistance", definition: "Support is a price level where the market tends to stop falling and bounce up. Resistance is where it tends to stop rising and reverse down." },
  { term: "Candlestick", definition: "A chart pattern that shows the open, high, low, and close price for a specific time period. Each candle represents one period (1 min, 1 hour, 1 day, etc.)." },
  { term: "RSI (Relative Strength Index)", definition: "A momentum indicator that measures the speed and change of price movements on a scale of 0-100. Above 70 = overbought (may fall), below 30 = oversold (may rise)." },
  { term: "Moving Average (MA)", definition: "An indicator that smooths price data by calculating the average price over a specific period. Common ones: 50 MA, 200 MA. Used to identify trend direction." },
  { term: "EMA (Exponential Moving Average)", definition: "A type of moving average that gives more weight to recent prices, making it more responsive to new information than a simple moving average (SMA)." },
  { term: "Forex", definition: "Foreign Exchange — the global market for trading currencies. The largest and most liquid financial market in the world, with $7.5 trillion traded daily." },
  { term: "Bull Market", definition: "A market condition where prices are rising or expected to rise. Traders say 'we are bullish' on a pair." },
  { term: "Bear Market", definition: "A market condition where prices are falling or expected to fall. Traders say 'we are bearish' on a pair." },
  { term: "Volatility", definition: "The rate at which the price of a currency pair increases or decreases. High volatility means large price swings, higher risk, and higher potential reward." },
  { term: "Liquidity", definition: "How easily an asset can be bought or sold without affecting its price. Major pairs like EUR/USD have high liquidity; exotic pairs have low liquidity." },
  { term: "Slippage", definition: "The difference between the expected price of a trade and the price at which it is actually executed. Common during high volatility or news events." },
  { term: "OCO Order", definition: "One Cancels Other — a pair of orders where if one is executed, the other is automatically canceled. Often used for stop loss and take profit together." },
  { term: "Paper Trading", definition: "Trading with virtual money (simulated) to practice strategies without risking real capital. Most platforms offer demo accounts for this." },
  { term: "Prop Firm", definition: "Proprietary Trading Firm — a company that gives you access to their capital to trade, usually after passing an evaluation challenge. You keep a percentage of the profits." },
  { term: "Drawdown Limit", definition: "A rule set by prop firms that limits how much your account can lose. If you hit the limit, you fail the evaluation or lose the funded account." },
  { term: "Session (Trading Session)", definition: "The period when major financial markets are open. The three main sessions are Asian (Tokyo), European (London), and American (New York). The London-New York overlap is the most active." },
];

export default function GlossaryClient() {
  const [search, setSearch] = useState("");

  const filtered = search
    ? terms.filter(t => t.term.toLowerCase().includes(search.toLowerCase()) || t.definition.toLowerCase().includes(search.toLowerCase()))
    : terms;

  return (
    <>
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</a>
        <div className="hidden md:flex items-center gap-4">
          <a href="/education" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Learn</a>
          <ThemeToggle />
        </div>
        <div className="md:hidden"><ThemeToggle /></div>
      </nav>

      <main className="bg-[var(--bg-primary)] min-h-screen px-6 py-8 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">📖 Trading Glossary</h1>
            <p className="text-[var(--text-muted)] text-sm">Quick definitions for common trading terms.</p>
          </div>

          <input
            type="text"
            placeholder="Search terms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] mb-6"
          />

          <div className="flex flex-col gap-2">
            {filtered.map(t => (
              <div key={t.term} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                <div className="text-[var(--accent-blue)] font-bold text-sm mb-1">{t.term}</div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{t.definition}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MobileNav />
    </>
  );
}
