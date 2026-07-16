import { useCallback, useEffect, useRef, useState } from 'react'
import {
  joinVoiceChannel,
  leaveVoiceChannel,
  updateVoiceParticipant,
  subscribeToVoiceParticipants,
  subscribeToVoiceSignals,
  sendVoiceSignal,
  fetchVoiceParticipants,
} from '../lib/supabase'
import { getAudioConstraints, getIceServers } from '../lib/audio'
import type { UserSettings, VoiceParticipant } from '../types'

interface UseVoiceOptions {
  channelId: string | null
  settings: UserSettings
  enabled: boolean
}

export function useVoice({ channelId, settings, enabled }: UseVoiceOptions) {
  const [participants, setParticipants] = useState<VoiceParticipant[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const channelIdRef = useRef<string | null>(null)

  const cleanupPeer = useCallback((userId: string) => {
    const pc = peerConnectionsRef.current.get(userId)
    if (pc) {
      pc.close()
      peerConnectionsRef.current.delete(userId)
    }
    const audio = audioElementsRef.current.get(userId)
    if (audio) {
      audio.srcObject = null
      audio.remove()
      audioElementsRef.current.delete(userId)
    }
  }, [])

  const cleanupAll = useCallback(() => {
    peerConnectionsRef.current.forEach((_, userId) => cleanupPeer(userId))
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
  }, [cleanupPeer])

  const createPeerConnection = useCallback(
    async (remoteUserId: string, isInitiator: boolean) => {
      if (!channelIdRef.current || !localStreamRef.current) return
      if (peerConnectionsRef.current.has(remoteUserId)) return

      const pc = new RTCPeerConnection({ iceServers: getIceServers() })
      peerConnectionsRef.current.set(remoteUserId, pc)

      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!)
      })

      pc.ontrack = (event) => {
        let audio = audioElementsRef.current.get(remoteUserId)
        if (!audio) {
          audio = document.createElement('audio')
          audio.autoplay = true
          audio.volume = settings.outputVolume / 100
          if (settings.speakerDeviceId !== 'default' && 'setSinkId' in audio) {
            ;(audio as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> })
              .setSinkId(settings.speakerDeviceId)
              .catch(() => {})
          }
          document.body.appendChild(audio)
          audioElementsRef.current.set(remoteUserId, audio)
        }
        audio.srcObject = event.streams[0]
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && channelIdRef.current) {
          sendVoiceSignal(
            channelIdRef.current,
            settings.userId,
            remoteUserId,
            'ice-candidate',
            event.candidate.toJSON()
          )
        }
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          cleanupPeer(remoteUserId)
        }
      }

      if (isInitiator) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        await sendVoiceSignal(
          channelIdRef.current,
          settings.userId,
          remoteUserId,
          'offer',
          offer
        )
      }
    },
    [settings.userId, settings.outputVolume, settings.speakerDeviceId, cleanupPeer]
  )

  const handleSignal = useCallback(
    async (signal: {
      from_user_id: string
      signal_type: string
      signal_data: RTCSessionDescriptionInit | RTCIceCandidateInit
    }) => {
      const remoteUserId = signal.from_user_id
      let pc = peerConnectionsRef.current.get(remoteUserId)

      if (signal.signal_type === 'offer') {
        if (!pc) {
          await createPeerConnection(remoteUserId, false)
          pc = peerConnectionsRef.current.get(remoteUserId)
        }
        if (!pc) return
        await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data as RTCSessionDescriptionInit))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        if (channelIdRef.current) {
          await sendVoiceSignal(
            channelIdRef.current,
            settings.userId,
            remoteUserId,
            'answer',
            answer
          )
        }
      } else if (signal.signal_type === 'answer') {
        if (!pc) return
        await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data as RTCSessionDescriptionInit))
      } else if (signal.signal_type === 'ice-candidate') {
        if (!pc) {
          await createPeerConnection(remoteUserId, false)
          pc = peerConnectionsRef.current.get(remoteUserId)
        }
        if (!pc) return
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.signal_data as RTCIceCandidateInit))
        } catch {
          // ICE candidate may arrive before remote description
        }
      }
    },
    [createPeerConnection, settings.userId]
  )

  const connect = useCallback(async () => {
    if (!channelId || !enabled) return
    setError(null)
    channelIdRef.current = channelId

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: getAudioConstraints(settings),
        video: false,
      })
      localStreamRef.current = stream

      await joinVoiceChannel(channelId, settings.userId, settings.username)
      setIsConnected(true)

      const existing = (await fetchVoiceParticipants(channelId)).filter(
        (p) => p.user_id !== settings.userId
      )
      for (const p of existing) {
        await createPeerConnection(p.user_id, true)
      }
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Разрешите доступ к микрофону в браузере'
          : 'Не удалось подключиться к голосовому каналу'
      )
      cleanupAll()
    }
  }, [channelId, enabled, settings, createPeerConnection, cleanupAll])

  const disconnect = useCallback(async () => {
    if (channelIdRef.current) {
      await leaveVoiceChannel(channelIdRef.current, settings.userId)
    }
    cleanupAll()
    channelIdRef.current = null
    setIsConnected(false)
    setIsMuted(false)
    setIsDeafened(false)
  }, [settings.userId, cleanupAll])

  const toggleMute = useCallback(async () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !newMuted
    })
    if (channelIdRef.current) {
      await updateVoiceParticipant(channelIdRef.current, settings.userId, { is_muted: newMuted })
    }
  }, [isMuted, settings.userId])

  const toggleDeafen = useCallback(async () => {
    const newDeafened = !isDeafened
    setIsDeafened(newDeafened)
    audioElementsRef.current.forEach((audio) => {
      audio.muted = newDeafened
    })
    if (newDeafened && !isMuted) {
      localStreamRef.current?.getAudioTracks().forEach((t) => {
        t.enabled = false
      })
      setIsMuted(true)
    }
    if (channelIdRef.current) {
      await updateVoiceParticipant(channelIdRef.current, settings.userId, {
        is_deafened: newDeafened,
        is_muted: newDeafened ? true : isMuted,
      })
    }
  }, [isDeafened, isMuted, settings.userId])

  useEffect(() => {
    if (!channelId || !enabled) {
      setParticipants([])
      return
    }
    return subscribeToVoiceParticipants(channelId, (p) => {
      setParticipants(p)
      if (isConnected) {
        p.forEach(async (participant) => {
          if (
            participant.user_id !== settings.userId &&
            !peerConnectionsRef.current.has(participant.user_id)
          ) {
            await createPeerConnection(participant.user_id, true)
          }
        })
        const activeIds = new Set(p.map((x) => x.user_id))
        peerConnectionsRef.current.forEach((_, userId) => {
          if (userId !== settings.userId && !activeIds.has(userId)) {
            cleanupPeer(userId)
          }
        })
      }
    })
  }, [channelId, enabled, isConnected, settings.userId, createPeerConnection, cleanupPeer])

  useEffect(() => {
    if (!channelId || !isConnected) return
    return subscribeToVoiceSignals(channelId, settings.userId, handleSignal)
  }, [channelId, isConnected, settings.userId, handleSignal])

  useEffect(() => {
    return () => {
      if (channelIdRef.current) {
        leaveVoiceChannel(channelIdRef.current, settings.userId)
      }
      cleanupAll()
    }
  }, [settings.userId, cleanupAll])

  return {
    participants,
    isConnected,
    isMuted,
    isDeafened,
    error,
    connect,
    disconnect,
    toggleMute,
    toggleDeafen,
  }
}
