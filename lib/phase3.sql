-- Phase 3: Image uploads, voice notes, message reactions
-- Run in Supabase SQL Editor

-- 1. Add image_url and audio_url columns to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- 2. Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON message_reactions(message_id);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants can manage reactions"
  ON message_reactions FOR ALL
  USING (
    message_id IN (
      SELECT id FROM messages WHERE conversation_id IN (
        SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
      )
    )
  );
