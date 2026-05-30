import { createClient } from "@supabase/supabase-js"

export async function GET(req, { params }) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return Response.json({ error: "No auth" }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const cid = (await params).id

    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", cid)
      .eq("user_id", user.id)
      .single()

    if (!participant) return Response.json({ error: "Not a participant" }, { status: 403 })

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", cid)
      .order("created_at", { ascending: true })

    if (error) return Response.json({ error: error.message }, { status: 500 })

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url, display_name")

    const profileMap = {}
    profiles?.forEach(p => { profileMap[p.user_id] = p })

    const enriched = messages?.map(m => ({
      ...m,
      sender: profileMap[m.sender_id] || null,
    })) || []

    return Response.json({ messages: enriched })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req, { params }) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return Response.json({ error: "No auth" }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const cid = (await params).id

    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", cid)
      .eq("user_id", user.id)
      .single()

    if (!participant) return Response.json({ error: "Not a participant" }, { status: 403 })

    const { content, image_url, audio_url, file_url, file_name, file_size } = await req.json()

    const insertData = { conversation_id: cid, sender_id: user.id, content: content || "" }
    if (image_url) insertData.image_url = image_url
    if (audio_url) insertData.audio_url = audio_url
    if (file_url) insertData.file_url = file_url
    if (file_name) insertData.file_name = file_name
    if (file_size != null) insertData.file_size = file_size

    const { data: msg, error: msgErr } = await supabase
      .from("messages")
      .insert([insertData])
      .select()
      .single()

    if (msgErr) return Response.json({ error: msgErr.message }, { status: 500 })

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", cid)

    // Notify other participants
    const { data: otherParticipants } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", cid)
      .neq("user_id", user.id)

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", user.id)
      .single()

    const senderName = myProfile?.username || "Someone"

    for (const p of otherParticipants || []) {
      const { data: recipient } = await supabase
        .from("profiles")
        .select("notification_prefs")
        .eq("user_id", p.user_id)
        .single()

      if (recipient?.notification_prefs?.community_replies !== false) {
        await supabase.from("notifications").insert([{
          user_id: p.user_id,
          type: "message",
          message: senderName + " sent you a message",
          is_read: false,
          link: "/inbox/" + cid,
        }])
        fetch(process.env.NEXT_PUBLIC_SITE_URL + "/api/send-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: p.user_id,
            title: "MatrixVerse",
            body: senderName + " sent you a message",
            url: "/inbox/" + cid,
          }),
        }).catch(() => {})
      }
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url, display_name")
      .eq("user_id", user.id)
      .single()

    return Response.json({ message: { ...msg, sender: profiles || null } })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
