"use client"
import { useState, useEffect, useRef, use, useCallback } from "react"
import { supabase } from "../../../lib/supabase"
import { useRouter } from "next/navigation"
import InboxIcon from "../../components/InboxIcon"
import ThemeToggle from "../../components/ThemeToggle"
import MobileNav from "../../components/MobileNav"

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"]

export default function Conversation({ params }) {
  const { id } = use(params)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [otherUser, setOtherUser] = useState(null)
  const [typing, setTyping] = useState(false)
  const [otherOnline, setOtherOnline] = useState(false)
  const [reactions, setReactions] = useState({})
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [showAddPeople, setShowAddPeople] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const router = useRouter()
  const bottomRef = useRef(null)
  const typingTimeout = useRef(null)
  const typingChannel = useRef(null)
  const presenceChannel = useRef(null)
  const fileInputRef = useRef(null)
  const fileInputGeneralRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const fetchMessages = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch("/api/conversations/" + id + "/messages", {
      headers: { Authorization: "Bearer " + session.access_token },
    })
    const data = await res.json()
    if (data.messages) setMessages(data.messages)
  }, [id])

  const fetchReactions = useCallback(async (msgs) => {
    if (!msgs?.length) return
    const ids = msgs.map(m => m.id).join(",")
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch("/api/reactions?ids=" + ids, {
      headers: { Authorization: "Bearer " + session.access_token },
    })
    const data = await res.json()
    if (data.reactions) setReactions(data.reactions)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setCurrentUser(user)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await fetchMessages()

      await fetch("/api/conversations/" + id + "/read", {
        method: "POST",
        headers: { Authorization: "Bearer " + session.access_token },
      })

      try {
        const convRes = await fetch("/api/conversations", {
          headers: { Authorization: "Bearer " + session.access_token },
        })
        const convData = await convRes.json()
        const conv = convData.conversations?.find(c => String(c.id) === String(id))
        if (conv) {
          setConversation(conv)
          if (!conv.is_group && conv.other_user) setOtherUser(conv.other_user)
        }
      } catch (e) {}

      setLoading(false)
    }
    init()
  }, [id, fetchMessages])

  useEffect(() => {
    if (messages.length > 0) fetchReactions(messages)
  }, [messages, fetchReactions])

  useEffect(() => {
    const channel = supabase
      .channel("messages-" + id)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: "conversation_id=eq." + id,
      }, () => fetchMessages())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, fetchMessages])

  useEffect(() => {
    if (!currentUser || (!otherUser && !conversation?.is_group)) return
    typingChannel.current = supabase.channel("typing-" + id, {
      config: { broadcast: { self: true } },
    })
    typingChannel.current.on("broadcast", { event: "typing" }, (payload) => {
      const targetId = conversation?.is_group
        ? conversation.participants?.map(p => p.user_id).filter(pid => pid !== currentUser?.id)
        : [otherUser?.user_id]
      if (targetId?.includes(payload.user_id)) {
        setTyping(true)
        clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => setTyping(false), 2000)
      }
    })
    typingChannel.current.subscribe()
    return () => {
      supabase.removeChannel(typingChannel.current)
      clearTimeout(typingTimeout.current)
    }
  }, [id, currentUser, otherUser, conversation])

  useEffect(() => {
    if (!otherUser) return
    presenceChannel.current = supabase.channel("presence-" + id, {
      config: { presence: { key: currentUser?.id } },
    })
    presenceChannel.current
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.current.presenceState()
        setOtherOnline(!!state[otherUser?.user_id])
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.current.track({ online_at: new Date().toISOString() })
        }
      })
    return () => { supabase.removeChannel(presenceChannel.current) }
  }, [id, currentUser, otherUser])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleTyping = () => {
    if (!typingChannel.current) return
    typingChannel.current.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: currentUser?.id },
    })
  }

  const sendMessage = async (opts = {}) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch("/api/conversations/" + id + "/messages", {
      method: "POST",
      headers: { Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" },
      body: JSON.stringify({ content: "", ...opts }),
    })
  }

  const sendTextMessage = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    await sendMessage({ content: newMessage.trim() })
    setNewMessage("")
    setSending(false)
  }

  const uploadAndSend = async (file) => {
    setUploading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: "Bearer " + session.access_token },
      body: formData,
    })
    const data = await res.json()
    if (data.url) {
      if (data.type === "image") {
        await sendMessage({ image_url: data.url })
      } else if (data.type === "audio") {
        await sendMessage({ audio_url: data.url })
      } else {
        await sendMessage({ file_url: data.url, file_name: data.name, file_size: data.size })
      }
    }
    setUploading(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const file = new File([blob], "voice-" + Date.now() + ".webm", { type: "audio/webm" })
        await uploadAndSend(file)
      }
      mediaRecorderRef.current.start()
      setRecording(true)
    } catch (e) {
      console.error("Mic error:", e)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const toggleReaction = async (messageId, emoji) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch("/api/reactions", {
      method: "POST",
      headers: { Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId, emoji }),
    })
    fetchReactions(messages)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) uploadAndSend(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (fileInputGeneralRef.current) fileInputGeneralRef.current.value = ""
  }

  const addPerson = async (userId) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch("/api/conversations/" + id + "/participants", {
      method: "POST",
      headers: { Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    })
    setShowAddPeople(false)
    // Refresh
    const convRes = await fetch("/api/conversations", {
      headers: { Authorization: "Bearer " + session.access_token },
    })
    const convData = await convRes.json()
    const conv = convData.conversations?.find(c => String(c.id) === String(id))
    if (conv) setConversation(conv)
  }

  const openAddPeople = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .not("user_id", "eq", currentUser?.id)
    const existingIds = conversation?.participants?.map(p => p.user_id) || []
    if (otherUser?.user_id) existingIds.push(otherUser.user_id)
    setAllUsers((profiles || []).filter(p => !existingIds.includes(p.user_id)))
    setShowAddPeople(true)
  }

  const groupedReactions = (msgId) => {
    const msgReactions = reactions[msgId] || []
    const grouped = {}
    msgReactions.forEach(r => {
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [] }
      grouped[r.emoji].count++
      grouped[r.emoji].users.push(r.user_id)
    })
    return grouped
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ""
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / 1048576).toFixed(1) + " MB"
  }

  const isGroup = conversation?.is_group
  const headerName = conversation?.name || otherUser?.display_name || otherUser?.username || "Chat"

  return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex flex-col">
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/inbox")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex items-center gap-2">
            {isGroup ? (
              <div className="w-8 h-8 rounded-full bg-[var(--accent-gold)] flex items-center justify-center text-sm overflow-hidden">
                {conversation?.avatar_url ? <img src={conversation.avatar_url} alt="" className="w-full h-full object-cover" /> : "👥"}
              </div>
            ) : (
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-[var(--bg-primary)] font-bold text-xs overflow-hidden">
                  {otherUser?.avatar_url ? (
                    <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    otherUser?.username?.charAt(0).toUpperCase() || "?"
                  )}
                </div>
                <div className={"absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-secondary)] " + (otherOnline ? "bg-[var(--accent-green)]" : "bg-[var(--text-muted)]")} />
              </div>
            )}
            <div>
              <span className="text-[var(--text-primary)] font-bold text-sm">{headerName}</span>
              {isGroup ? (
                <p className="text-[10px] text-[var(--text-muted)]">
                  {conversation?.participants?.length ? (conversation.participants.length + 1) + " members" : "Group"}
                </p>
              ) : (
                <p className="text-[10px] text-[var(--text-muted)]">{otherOnline ? "Online" : "Offline"}</p>
              )}
            </div>
            {isGroup && (
              <button onClick={openAddPeople} className="ml-2 text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors" title="Add people">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              </button>
            )}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <InboxIcon username={currentUser?.user_metadata?.username} />
        </div>
        <div className="md:hidden"><InboxIcon username={currentUser?.user_metadata?.username} /><ThemeToggle /></div>
      </nav>

      {showAddPeople && (
        <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4">
          <p className="text-[var(--text-muted)] text-xs mb-2">Add people to group:</p>
          <div className="max-h-32 overflow-y-auto flex flex-col gap-1">
            {allUsers.length === 0 && <p className="text-[var(--text-muted)] text-xs">No more users to add</p>}
            {allUsers.map(u => (
              <button
                key={u.user_id}
                onClick={() => addPerson(u.user_id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--bg-tertiary)] text-left transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-[8px] text-[var(--bg-primary)] font-bold overflow-hidden">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : u.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-[var(--text-primary)] text-xs">{u.display_name || u.username}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
            const msgReactions = groupedReactions(msg.id)
            return (
              <div key={msg.id} className="group">
                <div className={"flex " + (isMine ? "justify-end" : "justify-start")}>
                  <div className={"max-w-[75%] " + (isMine ? "items-end" : "items-start")}>
                    {isGroup && !isMine && (
                      <p className="text-[10px] text-[var(--accent-blue)] font-semibold mb-0.5 px-1">
                        {msg.sender?.display_name || msg.sender?.username || "Unknown"}
                      </p>
                    )}
                    <div className={"rounded-2xl px-4 py-2.5 " + (
                      isMine
                        ? "bg-[var(--accent-blue)] text-white rounded-br-md"
                        : "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md"
                    )}>
                      {msg.image_url && (
                        <img src={msg.image_url} alt="shared" className="max-w-full rounded-lg mb-1 max-h-64 object-contain" loading="lazy" />
                      )}
                      {msg.audio_url && (
                        <audio controls className="max-w-full h-10 mb-1" preload="none">
                          <source src={msg.audio_url} type="audio/webm" />
                        </audio>
                      )}
                      {msg.file_url && (
                        <a
                          href={msg.file_url}
                          target="_blank"
                          download={msg.file_name}
                          className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-primary)]/10 hover:bg-[var(--bg-primary)]/20 transition-colors mb-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{msg.file_name || "File"}</p>
                            {msg.file_size && <p className="text-[10px] opacity-60">{formatFileSize(msg.file_size)}</p>}
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </a>
                      )}
                      {msg.content && (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                      <p className={"text-[10px] mt-1 flex items-center justify-end gap-1 " + (isMine ? "text-blue-200" : "text-[var(--text-muted)]")}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {isMine && (
                          <span>{msg.read_at ? "✓✓" : "✓"}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5 px-1">
                      {Object.entries(msgReactions).map(([emoji, data]) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className={"text-xs px-1.5 py-0.5 rounded-full border transition-colors " + (
                            data.users.includes(currentUser?.id)
                              ? "bg-[var(--accent-blue-bg)] border-[var(--accent-blue)]"
                              : "border-[var(--border)] hover:border-[var(--accent-blue)]"
                          )}
                        >
                          {emoji} {data.count}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                        className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--accent-blue)] text-xs transition-all px-1"
                      >
                        😊
                      </button>
                      {showEmojiPicker === msg.id && (
                        <div className="absolute bottom-full left-0 mb-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-1.5 flex gap-1 shadow-lg z-10">
                          {EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => { toggleReaction(msg.id, emoji); setShowEmojiPicker(null) }}
                              className="text-lg hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl rounded-bl-md px-4 py-2.5">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-4">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] p-2 transition-colors disabled:opacity-50"
            title="Send image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

          <button
            onClick={() => fileInputGeneralRef.current?.click()}
            disabled={uploading}
            className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] p-2 transition-colors disabled:opacity-50"
            title="Send file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </button>
          <input type="file" ref={fileInputGeneralRef} onChange={handleFileSelect} className="hidden" />

          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={recording ? stopRecording : undefined}
            className={"p-2 rounded-full transition-colors " + (recording ? "bg-[var(--accent-red)] text-white animate-pulse" : "text-[var(--text-muted)] hover:text-[var(--accent-blue)]")}
            title={recording ? "Release to send" : "Hold to record voice"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>

          <input
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); handleTyping() }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendTextMessage() } }}
            placeholder={uploading ? "Uploading..." : "Type a message..."}
            className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-blue)] disabled:opacity-50"
            disabled={uploading}
          />
          <button
            onClick={sendTextMessage}
            disabled={!newMessage.trim() || sending || uploading}
            className="bg-[var(--accent-blue)] text-[var(--bg-primary)] p-2.5 rounded-full hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
      <MobileNav username={currentUser?.user_metadata?.username} />
    </main>
  )
}
