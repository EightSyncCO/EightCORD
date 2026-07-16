-- ShowelGrays Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Servers table
CREATE TABLE IF NOT EXISTS servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'voice')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice participants (who is in which voice channel)
CREATE TABLE IF NOT EXISTS voice_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  is_muted BOOLEAN DEFAULT FALSE,
  is_deafened BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- WebRTC signaling
CREATE TABLE IF NOT EXISTS voice_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channels_server ON channels(server_id, position);
CREATE INDEX IF NOT EXISTS idx_voice_participants_channel ON voice_participants(channel_id);
CREATE INDEX IF NOT EXISTS idx_voice_signals_channel ON voice_signals(channel_id, created_at);

-- Enable Row Level Security
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_signals ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (open chat - no auth required)
CREATE POLICY "Anyone can read servers" ON servers FOR SELECT USING (true);
CREATE POLICY "Anyone can read channels" ON channels FOR SELECT USING (true);
CREATE POLICY "Anyone can read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read voice participants" ON voice_participants FOR SELECT USING (true);
CREATE POLICY "Anyone can insert voice participants" ON voice_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update voice participants" ON voice_participants FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete voice participants" ON voice_participants FOR DELETE USING (true);
CREATE POLICY "Anyone can read voice signals" ON voice_signals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert voice signals" ON voice_signals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete voice signals" ON voice_signals FOR DELETE USING (true);

-- Enable Realtime for messages and voice
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_signals;

-- Seed MYGREY'S server with channels
INSERT INTO servers (id, name) VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'MYGREY''S')
ON CONFLICT (id) DO NOTHING;

INSERT INTO channels (id, server_id, name, type, position) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'общий', 'text', 0),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'мемы', 'text', 1),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Лобби', 'voice', 2),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Игры', 'voice', 3),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Музыка', 'voice', 4)
ON CONFLICT (id) DO NOTHING;

-- Welcome message (only if channel is empty)
INSERT INTO messages (channel_id, user_id, username, content)
SELECT 'b0000000-0000-0000-0000-000000000001', 'system', 'ShowelGrays', 'Добро пожаловать на сервер MYGREY''S! 🌌'
WHERE NOT EXISTS (
  SELECT 1 FROM messages WHERE channel_id = 'b0000000-0000-0000-0000-000000000001'
);
