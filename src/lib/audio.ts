import type { UserSettings } from '../types'

const SETTINGS_KEY = 'showelgrays_settings'

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      return { ...getDefaultSettings(), ...JSON.parse(raw) }
    }
  } catch {
    // ignore
  }
  return getDefaultSettings()
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function getDefaultSettings(): UserSettings {
  let userId = localStorage.getItem('showelgrays_user_id')
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem('showelgrays_user_id', userId)
  }
  const savedUsername = localStorage.getItem('showelgrays_username')
  return {
    username: savedUsername ?? `Guest_${userId.slice(0, 6)}`,
    userId,
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
}

export function saveUsername(username: string): void {
  localStorage.setItem('showelgrays_username', username)
}

export function getAudioConstraints(settings: UserSettings): MediaTrackConstraints {
  const constraints: MediaTrackConstraints = {
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
    autoGainControl: settings.autoGainControl,
  }
  if (settings.micDeviceId && settings.micDeviceId !== 'default') {
    constraints.deviceId = { exact: settings.micDeviceId }
  }
  return constraints
}

export async function getAudioDevices(): Promise<{
  inputs: MediaDeviceInfo[]
  outputs: MediaDeviceInfo[]
}> {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true })
    const devices = await navigator.mediaDevices.enumerateDevices()
    return {
      inputs: devices.filter((d) => d.kind === 'audioinput'),
      outputs: devices.filter((d) => d.kind === 'audiooutput'),
    }
  } catch {
    return { inputs: [], outputs: [] }
  }
}

export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
  const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined
  const turnUser = import.meta.env.VITE_TURN_USERNAME as string | undefined
  const turnCred = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined
  if (turnUrl && turnUser && turnCred) {
    servers.push({ urls: turnUrl, username: turnUser, credential: turnCred })
  }
  return servers
}
