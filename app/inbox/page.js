"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import { useRouter } from "next/navigation"
import InboxIcon from "../components/InboxIcon"
import ThemeToggle from "../components/ThemeToggle"
import MobileNav from "../components/MobileNav"

export default function Inbox() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [groupName, setGroupName] = useState("")
  const searchTimeout = useRef(null)
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

  const handleSearch = (value) => {
    setSearchQuery(value)
    clearTimeout(searchTimeout.current)
    if (!value.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch("/api/conversations/search?q=" + encodeURIComponent(value), {
        headers: { Authorization: "Bearer " + session.access_token },
      })
      const data = await res.json()
      setSearchResults(data.results || [])
      setSearching(false)
    }, 300)
  }

  const openNewGroup = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .not("user_id", "eq", currentUser?.id)
    setAllUsers(profiles || [])
    setSelectedUsers([])
    setGroupName("")
    setShowNewGroup(true)
  }

  const createGroup = async () => {
    if (selectedUsers.length < 2) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" },
      body: JSON.stringify({
        participant_ids: selectedUsers.map(u => u.user_id),
        name: groupName.trim() || null,
      }),
    })
    const data = await res.json()
    if (data.conversation_id) {
      setShowNewGroup(false)
      router.push("/inbox/" + data.conversation_id)
    }
  }

  const toggleUser = (user) => {
    setSelectedUsers(prev =>
      prev.find(u => u.user_id === user.user_id)
        ? prev.filter(u => u.user_id !== user.user_id)
        : [...prev, user]
    )
  }

  return (
    <main className="bg-[var(--bg-primary)] min-h-screen">
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</a>
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <InboxIcon username={currentUser?.user_metadata?.username} />
          <a href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Dashboard</a>
          <a href="/community" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Community</a>
          <a href={"/profile/" + (currentUser?.user_metadata?.username || "")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Profile</a>
        </div>
        <div className="md:hidden"><InboxIcon username={currentUser?.user_metadata?.username} /><ThemeToggle /></div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[var(--text-primary)] font-bold text-2xl">Inbox</h1>
          <button onClick={openNewGroup} className="text-xs bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-4 py-2 rounded-full hover:bg-[var(--accent-blue-hover)] transition-colors">
            + New Group
          </button>
        </div>

        <div className="relative mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {showNewGroup && (
          <div className="mb-6 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
            <h3 className="text-[var(--text-primary)] font-bold mb-3">New Group</h3>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name (optional)"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-blue)] mb-3"
            />
            <p className="text-[var(--text-muted)] text-xs mb-2">Select participants ({selectedUsers.length} selected):</p>
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1 mb-3">
              {allUsers.map(u => (
                <button
                  key={u.user_id}
                  onClick={() => toggleUser(u)}
                  className={"flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors " + (
                    selectedUsers.find(s => s.user_id === u.user_id)
                      ? "bg-[var(--accent-blue-bg)]"
                      : "hover:bg-[var(--bg-tertiary)]"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-[10px] text-[var(--bg-primary)] font-bold overflow-hidden">
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : u.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[var(--text-primary)] text-sm">{u.display_name || u.username}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewGroup(false)} className="border border-[var(--border)] text-[var(--text-muted)] text-xs font-bold px-4 py-2 rounded-full">Cancel</button>
              <button onClick={createGroup} disabled={selectedUsers.length < 2} className="bg-[var(--accent-blue)] text-[var(--bg-primary)] text-xs font-bold px-4 py-2 rounded-full disabled:opacity-50">Create Group</button>
            </div>
          </div>
        )}

        {searchQuery.trim() && searchResults.length > 0 && (
          <div className="mb-6 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="px-4 py-2 border-b border-[var(--border)] text-[var(--text-muted)] text-xs font-semibold">
              Search Results ({searchResults.length})
            </div>
            {searchResults.map(msg => (
              <button
                key={msg.id}
                onClick={() => router.push("/inbox/" + msg.conversation_id)}
                className="w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] border-b border-[var(--border)] last:border-0 transition-colors"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[var(--accent-blue)] text-xs font-bold">{msg.sender?.username || "Unknown"}</span>
                  <span className="text-[var(--text-muted)] text-[10px]">{new Date(msg.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-[var(--text-primary)] text-sm">{msg.content || (msg.image_url ? "📷 Image" : msg.audio_url ? "🎵 Voice" : "📎 File")}</p>
              </button>
            ))}
          </div>
        )}

        {searchQuery.trim() && searchResults.length === 0 && !searching && (
          <div className="text-center py-10">
            <p className="text-[var(--text-muted)] text-sm">No messages found</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 animate-pulse">
                <div className="h-4 w-32 bg-[var(--border)] rounded mb-2" />
                <div className="h-3 w-48 bg-[var(--border)] rounded" />
              </div>
            ))}
          </div>
        ) : !searchQuery.trim() && conversations.length === 0 ? (
          <div className="text-center py-20 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-[var(--text-muted)] text-sm">No conversations yet</p>
            <p className="text-[var(--text-muted)] text-xs mt-1">Visit someone&apos;s profile to send a message</p>
          </div>
        ) : !searchQuery.trim() && (
          <div className="flex flex-col gap-2">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => router.push("/inbox/" + conv.id)}
                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 text-left hover:border-[var(--accent-blue)] transition-colors flex items-center gap-3"
              >
                <div className={"w-10 h-10 rounded-full flex items-center justify-center text-[var(--bg-primary)] font-bold text-sm flex-shrink-0 overflow-hidden " + (conv.is_group ? "bg-[var(--accent-gold)]" : "bg-[var(--accent-blue)]")}>
                  {conv.avatar_url ? (
                    <img src={conv.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : conv.is_group ? (
                    "👥"
                  ) : (
                    conv.other_user?.username?.charAt(0).toUpperCase() || "?"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-primary)] font-bold text-sm truncate">
                      {conv.name || "Unknown"}
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
                  {conv.is_group && conv.participants?.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {conv.participants.slice(0, 3).map(p => (
                        <div key={p.user_id} className="w-4 h-4 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-[8px] text-[var(--bg-primary)] font-bold overflow-hidden">
                          {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : p.username?.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {conv.participants.length > 3 && (
                        <span className="text-[10px] text-[var(--text-muted)]">+{conv.participants.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <MobileNav username={currentUser?.user_metadata?.username} />
    </main>
  )
}
