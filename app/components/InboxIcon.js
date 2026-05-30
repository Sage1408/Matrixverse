"use client"
import { useState, useEffect, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { useRouter } from "next/navigation"

export default function InboxIcon({ username }) {
  const [unread, setUnread] = useState(0)
  const router = useRouter()

  const fetchUnread = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    try {
      const res = await fetch("/api/conversations", {
        headers: { Authorization: "Bearer " + session.access_token },
      })
      const data = await res.json()
      if (data.conversations) {
        const total = data.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
        setUnread(total)
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  return (
    <button onClick={() => router.push("/inbox")} className="flex items-center gap-1.5 relative text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-sm" title="Inbox">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
      <span>Messages</span>
      {unread > 0 && (
        <span className="bg-[var(--accent-red)] text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  )
}
