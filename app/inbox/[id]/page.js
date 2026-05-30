"use client"
import { useState, useEffect, useRef, use } from "react"
import { supabase } from "../../../lib/supabase"
import { useRouter } from "next/navigation"
import InboxIcon from "../../components/InboxIcon"
import ThemeToggle from "../../components/ThemeToggle"

export default function Conversation({ params }) {
  const { id } = use(params)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [otherUser, setOtherUser] = useState(null)
  const router = useRouter()
  const bottomRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setCurrentUser(user)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch("/api/conversations/" + id + "/messages", {
        headers: { Authorization: "Bearer " + session.access_token },
      })
      const data = await res.json()
      if (data.messages) setMessages(data.messages)

      // Find other user info
      if (data.messages?.length > 0) {
        const otherMsg = data.messages.find(m => m.sender_id !== user.id)
        if (otherMsg?.sender) setOtherUser(otherMsg.sender)
      }

      // Mark as read
      await fetch("/api/conversations/" + id + "/read", {
        method: "POST",
        headers: { Authorization: "Bearer " + session.access_token },
      })

      // Get other participant info from conversations API
      if (!otherUser) {
        try {
          const convRes = await fetch("/api/conversations", {
            headers: { Authorization: "Bearer " + session.access_token },
          })
          const convData = await convRes.json()
          const conv = convData.conversations?.find(c => String(c.id) === String(id))
          if (conv?.other_user) setOtherUser(conv.other_user)
        } catch (e) {}
      }

      setLoading(false)
    }
    init()
  }, [id])

  useEffect(() => {
    const channel = supabase
      .channel("messages-" + id)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: "conversation_id=eq." + id,
      }, async (payload) => {
        const newMsg = payload.new
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const res = await fetch("/api/conversations/" + id + "/messages", {
          headers: { Authorization: "Bearer " + session.access_token },
        })
        const data = await res.json()
        if (data.messages) setMessages(data.messages)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch("/api/conversations/" + id + "/messages", {
      method: "POST",
      headers: { Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage.trim() }),
    })
    setNewMessage("")
    setSending(false)
  }

  return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex flex-col">
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/inbox")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <span className="text-[var(--text-primary)] font-bold text-sm">
              {otherUser?.display_name || otherUser?.username || "Chat"}
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <InboxIcon username={currentUser?.user_metadata?.username} />
        </div>
        <div className="md:hidden"><ThemeToggle /></div>
      </nav>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--text-muted)] text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === currentUser?.id
            return (
              <div key={msg.id} className={"flex " + (isMine ? "justify-end" : "justify-start")}>
                <div className={"max-w-[75%] rounded-2xl px-4 py-2.5 " + (
                  isMine
                    ? "bg-[var(--accent-blue)] text-white rounded-br-md"
                    : "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md"
                )}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={"text-[10px] mt-1 " + (isMine ? "text-blue-200" : "text-[var(--text-muted)]")}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {isMine && (
                      <span className="ml-1">{msg.read_at ? "✓✓" : "✓"}</span>
                    )}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Type a message..."
            className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-[var(--accent-blue)] text-[var(--bg-primary)] p-2.5 rounded-full hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </main>
  )
}
