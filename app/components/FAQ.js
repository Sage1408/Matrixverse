"use client";

import { useState } from "react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Is MatrixVerse free to use?",
      answer: "Yes! The free plan gives you access to the trading journal, community feed, and basic stats forever. No credit card needed.",
    },
    {
      question: "How does the AI trade analyzer work?",
      answer: "You log a trade or upload a screenshot, and our AI analyzes your entry quality, risk management, RR ratio, and emotional patterns. It then gives you a score and improvement suggestions.",
    },
    {
      question: "Which prop firms are supported?",
      answer: "We support FTMO, FundedNext, Funding Pips, The5ers, MyForexFunds, NairaTrader and more. We add new firms regularly based on user requests.",
    },
    {
      question: "Can I import trades from MT4 or MT5?",
      answer: "Currently you can upload MT4/MT5 screenshots and log trades manually. Automatic sync with MT4/MT5 is coming in a future update.",
    },
    {
      question: "Is my trading data private?",
      answer: "Yes. Your journal data is completely private by default. You choose what to share publicly on your profile and what stays private.",
    },
    {
      question: "Can I cancel my premium subscription anytime?",
      answer: "Absolutely. You can cancel anytime from your settings page. No questions asked. You keep premium access until the end of your billing period.",
    },
    {
      question: "Is there a mobile app?",
      answer: "The web platform is fully mobile responsive and works great on any phone browser. A dedicated mobile app is on our roadmap.",
    },
    {
      question: "How does the leaderboard work?",
      answer: "Leaderboards rank traders by win rate, RR ratio, streak, and profitability. They reset weekly and monthly. You need at least 10 logged trades to appear on the board.",
    },
  ];

  return (
    <section id="faq" className="bg-[#0D1117] py-24 px-6">
      <div className="max-w-3xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-16">
          <div className="inline-block bg-[#161B22] border border-[#30363D] text-[#00D4FF] text-xs font-semibold px-4 py-2 rounded-full mb-4">
            ❓ FAQ
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Common Questions
          </h2>
          <p className="text-[#8B949E] text-lg">
            Everything you need to know before getting started.
          </p>
        </div>

        {/* FAQ LIST */}
        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden"
            >
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-white font-semibold text-sm">{faq.question}</span>
                <span className="text-[#00D4FF] text-lg flex-shrink-0">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-[#8B949E] text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}