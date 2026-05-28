"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

const steps = [
  {
    title: "Welcome to MatrixVerse! 🚀",
    description: "The all-in-one platform for serious traders. Track your trades, analyze with AI, connect with the community, and climb the leaderboard.",
  },
  {
    title: "Log Your First Trade 📝",
    description: "Head to the Journal page to log your trades. Track entry/exit, pair, direction, P&L, and more. The more you log, the better your insights!",
  },
  {
    title: "Analyze with AI 🤖",
    description: "Use the AI Trade Analyzer to get feedback on your trades. Paste your trade details and get actionable suggestions to improve.",
  },
  {
    title: "Join the Community 👥",
    description: "Share your trades, follow other traders, and learn from the community. Use the Search page to find traders by username.",
  },
  {
    title: "Track Your Psychology 🧠",
    description: "Log daily check-ins to track your mental state. A strong mindset is the key to consistent profitability.",
  },
  {
    title: "Check the Leaderboard 🏆",
    description: "See how you stack up against other traders. Top performers get featured on the leaderboard.",
  },
]

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(0)
  const [closing, setClosing] = useState(false)
  const router = useRouter()

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => {
      localStorage.setItem("matrixverse-onboarded", "true")
      onComplete?.()
    }, 300)
  }

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      handleClose()
    }
  }

  const handleSkip = () => {
    localStorage.setItem("matrixverse-onboarded", "true")
    onComplete?.()
  }

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />
      <div className="relative bg-[var(--bg-secondary)] border border-[var(--border)] rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-[var(--accent-blue)]" : "bg-[var(--border)]"}`} />
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[200px] flex flex-col justify-center">
          <h2 className="text-[var(--text-primary)] text-xl font-bold mb-3">{steps[step].title}</h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{steps[step].description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]">
          <button onClick={handleSkip} className="text-[var(--text-muted)] text-xs hover:text-[var(--text-primary)] transition-colors">
            Skip tour
          </button>
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="border border-[var(--border)] text-[var(--text-secondary)] text-sm font-semibold px-5 py-2 rounded-full hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors">
                Back
              </button>
            )}
            <button onClick={handleNext} className="bg-[var(--accent-blue)] text-[var(--bg-primary)] text-sm font-bold px-6 py-2 rounded-full hover:bg-[var(--accent-blue-hover)] transition-colors">
              {step < steps.length - 1 ? "Next" : "Get Started"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
