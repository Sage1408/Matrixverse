"use client"
import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import InboxIcon from "../components/InboxIcon"
import ThemeToggle from "../components/ThemeToggle"

export default function Inbox() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setCurrentUser(user)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch("/api/conversations", {
        headers: { Authorization: "Bearer " + session.access_token },
      })
      const data = await res.json()
      if (data.conversations) setConversations(data.conversations)
      setLoading(false)
    }
    init()
  }, [])

  return (
    <main className="bg-[var(--bg-primary)] min-h-screen">
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</a>
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <InboxIcon username={currentUser?.user_metadata?.username} />
          <a href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Dashboard</a>
          <a href="/community" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Community</a>
          <a href="/profile/" + (currentUser?.user_metadata?.username || "") className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Profile</a>
        </div>
        <div className="md:hidden"><ThemeToggle /></div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 pb-24">
        <h1 className="text-[var(--text-primary)] font-bold text-2xl mb-6">Inbox</h1>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 animate-pulse">
                <div className="h-4 w-32 bg-[var(--border)] rounded mb-2" />
                <div className="h-3 w-48 bg-[var(--border)] rounded" />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-[var(--text-muted)] text-sm">No conversations yet</p>
            <p className="text-[var(--text-muted)] text-xs mt-1">Visit someone&apos;s profile to send a message</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => router.push("/inbox/" + conv.id)}
                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 text-left hover:border-[var(--accent-blue)] transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-[var(--bg-primary)] font-bold text-sm flex-shrink-0 overflow-hidden">
                  {conv.other_user?.avatar_url ? (
                    <img src={conv.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    conv.other_user?.username?.charAt(0).toUpperCase() || "?"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-primary)] font-bold text-sm truncate">
                      {conv.other_user?.display_name || conv.other_user?.username || "Unknown"}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className="bg-[var(--accent-blue)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--text-muted)] text-xs truncate mt-0.5">
                    {conv.last_message?.content || "No messages yet"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
