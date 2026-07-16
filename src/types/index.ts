export interface Server {
  id: string
  name: string
  icon_url: string | null
  created_at: string
}

export interface Channel {
  id: string
  server_id: string
  name: string
  type: 'text' | 'voice'
  position: number
  created_at: string
}

export interface Message {
  id: string
  channel_id: string
  user_id: string
  username: string
  content: string
  created_at: string
}

export interface VoiceParticipant {
  id: string
  channel_id: string
  user_id: string
  username: string
  is_muted: boolean
  is_deafened: boolean
  joined_at: string
}

export interface VoiceSignal {
  id: string
  channel_id: string
  from_user_id: string
  to_user_id: string
  signal_type: 'offer' | 'answer' | 'ice-candidate'
  signal_data: RTCSessionDescriptionInit | RTCIceCandidateInit
  created_at: string
}

export interface UserSettings {
  username: string
  userId: string
  noiseSuppression: boolean
  echoCancellation: boolean
  autoGainControl: boolean
  inputVolume: number
  outputVolume: number
  micDeviceId: string
  speakerDeviceId: string
  showParticles: boolean
  animationsEnabled: boolean
}

export const DEFAULT_SERVER_ID = 'a0000000-0000-0000-0000-000000000001'
export const DEFAULT_TEXT_CHANNEL_ID = 'b0000000-0000-0000-0000-000000000001'

export const DEFAULT_SETTINGS: UserSettings = {
  username: '',
  userId: '',
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  inputVolume: 100,
  outputVolume: 100,
  micDeviceId: 'default',
  speakerDeviceId: 'default',
  showParticles: true,
  animationsEnabled: true,
}
