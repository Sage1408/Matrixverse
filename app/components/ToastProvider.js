"use client"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { supabase } from "../lib/supabase"

const ToastContext = createContext()

export function useToasts() {
  return useContext(ToastContext)
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel("toast-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const notif = payload.new
        addToast({
          id: notif.id,
          type: notif.type,
          message: notif.message,
          link: notif.link,
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const addToast = useCallback((toast) => {
    setToasts(prev => [...prev, toast])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id))
    }, 5000)
  }, [])

  const icons = {
    like: "❤️", comment: "💬", follow: "👤",
    streak: "🔥", badge: "🏅", leaderboard: "🏆",
    ai: "🤖", system: "📢",
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => { if (toast.link) window.location.href = toast.link }}
            className="pointer-events-auto bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 shadow-2xl max-w-sm cursor-pointer hover:bg-[var(--bg-tertiary)] transition-all animate-slide-up flex items-start gap-3"
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            <span className="text-xl flex-shrink-0">{icons[toast.type] || "🔔"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setToasts(prev => prev.filter(t => t.id !== toast.id)) }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs flex-shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
