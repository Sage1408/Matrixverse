import { createClient } from "@supabase/supabase-js"

export async function POST(req) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return Response.json({ error: "No auth" }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get("file")
    if (!file) return Response.json({ error: "No file" }, { status: 400 })

    const ext = file.name.split(".").pop()
    const isImage = file.type.startsWith("image/")
    const isAudio = file.type.startsWith("audio/")
    const folder = isImage ? "images" : isAudio ? "audio" : "files"
    const fileName = user.id + "/" + Date.now() + "." + ext

    const { data, error } = await supabase.storage
      .from("chat-uploads")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) return Response.json({ error: error.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage
      .from("chat-uploads")
      .getPublicUrl(fileName)

    return Response.json({
      url: publicUrl,
      type: isImage ? "image" : isAudio ? "audio" : "file",
      name: file.name,
      size: file.size,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
