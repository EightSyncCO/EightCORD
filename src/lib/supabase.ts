import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Server, Channel, Message, VoiceParticipant, VoiceSignal } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your_supabase') &&
  !supabaseAnonKey.includes('your_supabase')
)

let supabase: SupabaseClient | null = null

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

export { supabase }

export async function fetchServer(serverId: string): Promise<Server | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('servers')
    .select('*')
    .eq('id', serverId)
    .single()
  if (error) return null
  return data as Server
}

export async function fetchChannels(serverId: string): Promise<Channel[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('server_id', serverId)
    .order('position')
  if (error) return []
  return (data ?? []) as Channel[]
}

export async function fetchMessages(channelId: string, limit = 50): Promise<Message[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) return []
  return (data ?? []) as Message[]
}

export async function sendMessage(
  channelId: string,
  userId: string,
  username: string,
  content: string
): Promise<Message | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('messages')
    .insert({ channel_id: channelId, user_id: userId, username, content })
    .select()
    .single()
  if (error) return null
  return data as Message
}

export function subscribeToMessages(
  channelId: string,
  onMessage: (message: Message) => void
) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`messages:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => onMessage(payload.new as Message)
    )
    .subscribe()
  return () => {
    supabase?.removeChannel(channel)
  }
}

export async function fetchVoiceParticipants(channelId: string): Promise<VoiceParticipant[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('voice_participants')
    .select('*')
    .eq('channel_id', channelId)
  if (error) return []
  return (data ?? []) as VoiceParticipant[]
}

export async function joinVoiceChannel(
  channelId: string,
  userId: string,
  username: string
): Promise<VoiceParticipant | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('voice_participants')
    .upsert(
      { channel_id: channelId, user_id: userId, username, is_muted: false, is_deafened: false },
      { onConflict: 'channel_id,user_id' }
    )
    .select()
    .single()
  if (error) return null
  return data as VoiceParticipant
}

export async function leaveVoiceChannel(channelId: string, userId: string): Promise<void> {
  if (!supabase) return
  await supabase
    .from('voice_participants')
    .delete()
    .eq('channel_id', channelId)
    .eq('user_id', userId)
}

export async function updateVoiceParticipant(
  channelId: string,
  userId: string,
  updates: Partial<Pick<VoiceParticipant, 'is_muted' | 'is_deafened'>>
): Promise<void> {
  if (!supabase) return
  await supabase
    .from('voice_participants')
    .update(updates)
    .eq('channel_id', channelId)
    .eq('user_id', userId)
}

export function subscribeToVoiceParticipants(
  channelId: string,
  onUpdate: (participants: VoiceParticipant[]) => void
) {
  if (!supabase) return () => {}
  const refresh = async () => {
    const participants = await fetchVoiceParticipants(channelId)
    onUpdate(participants)
  }
  refresh()
  const channel = supabase
    .channel(`voice:${channelId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'voice_participants', filter: `channel_id=eq.${channelId}` },
      () => refresh()
    )
    .subscribe()
  return () => {
    supabase?.removeChannel(channel)
  }
}

export async function sendVoiceSignal(
  channelId: string,
  fromUserId: string,
  toUserId: string,
  signalType: VoiceSignal['signal_type'],
  signalData: RTCSessionDescriptionInit | RTCIceCandidateInit
): Promise<void> {
  if (!supabase) return
  await supabase.from('voice_signals').insert({
    channel_id: channelId,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    signal_type: signalType,
    signal_data: signalData,
  })
}

export function subscribeToVoiceSignals(
  channelId: string,
  userId: string,
  onSignal: (signal: VoiceSignal) => void
) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`signals:${channelId}:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'voice_signals',
        filter: `channel_id=eq.${channelId}`,
      },
      async (payload) => {
        const signal = payload.new as VoiceSignal
        if (signal.to_user_id === userId) {
          onSignal(signal)
          await supabase!.from('voice_signals').delete().eq('id', signal.id)
        }
      }
    )
    .subscribe()
  return () => {
    supabase?.removeChannel(channel)
  }
}
