import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpaceBackground } from './components/SpaceBackground'
import { ParticleField } from './components/ParticleField'
import { Sidebar, SetupBanner } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { VoicePanel } from './components/VoicePanel'
import { SettingsModal } from './components/SettingsModal'
import { useSettings } from './hooks/useSettings'
import { useMessages } from './hooks/useMessages'
import { useVoice } from './hooks/useVoice'
import {
  isSupabaseConfigured,
  fetchServer,
  fetchChannels,
} from './lib/supabase'
import { DEFAULT_SERVER_ID, DEFAULT_TEXT_CHANNEL_ID } from './types'
import type { Channel } from './types'

const DEMO_CHANNELS: Channel[] = [
  { id: 'b0000000-0000-0000-0000-000000000001', server_id: DEFAULT_SERVER_ID, name: 'общий', type: 'text', position: 0, created_at: '' },
  { id: 'b0000000-0000-0000-0000-000000000002', server_id: DEFAULT_SERVER_ID, name: 'мемы', type: 'text', position: 1, created_at: '' },
  { id: 'b0000000-0000-0000-0000-000000000003', server_id: DEFAULT_SERVER_ID, name: 'Лобби', type: 'voice', position: 2, created_at: '' },
  { id: 'b0000000-0000-0000-0000-000000000004', server_id: DEFAULT_SERVER_ID, name: 'Игры', type: 'voice', position: 3, created_at: '' },
  { id: 'b0000000-0000-0000-0000-000000000005', server_id: DEFAULT_SERVER_ID, name: 'Музыка', type: 'voice', position: 4, created_at: '' },
]

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-full border-2 border-gray-700 border-t-gray-400 mb-6"
      />
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-display text-2xl font-bold text-glow tracking-widest"
      >
        ShowelGrays
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-gray-500 text-sm mt-2"
      >
        Подключение к MYGREY'S...
      </motion.p>
    </div>
  )
}

export default function App() {
  const { settings, updateSettings, isOpen: settingsOpen, setIsOpen: setSettingsOpen } = useSettings()
  const [loading, setLoading] = useState(true)
  const [serverName, setServerName] = useState("MYGREY'S")
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>(null)
  const [connectingVoice, setConnectingVoice] = useState(false)
  const [showSetupBanner, setShowSetupBanner] = useState(!isSupabaseConfigured)

  const textChannelId = activeChannel?.type === 'text' ? activeChannel.id : null
  const voiceChannelId = activeChannel?.type === 'voice' ? activeChannel.id : null

  const { messages, loading: messagesLoading, sending, send } = useMessages(textChannelId)
  const voice = useVoice({
    channelId: voiceChannelId,
    settings,
    enabled: isSupabaseConfigured,
  })

  useEffect(() => {
    async function init() {
      if (isSupabaseConfigured) {
        const [server, chs] = await Promise.all([
          fetchServer(DEFAULT_SERVER_ID),
          fetchChannels(DEFAULT_SERVER_ID),
        ])
        if (server) setServerName(server.name)
        if (chs.length > 0) {
          setChannels(chs)
          const defaultText = chs.find((c) => c.id === DEFAULT_TEXT_CHANNEL_ID) ?? chs.find((c) => c.type === 'text')
          if (defaultText) setActiveChannel(defaultText)
        }
      } else {
        setChannels(DEMO_CHANNELS)
        setActiveChannel(DEMO_CHANNELS[0])
      }
      await new Promise((r) => setTimeout(r, 1500))
      setLoading(false)
    }
    init()
  }, [])

  const handleSelectChannel = useCallback(
    (channel: Channel) => {
      if (channel.type === 'voice') {
        if (activeVoiceChannelId && activeVoiceChannelId !== channel.id) {
          voice.disconnect()
          setActiveVoiceChannelId(null)
        }
      }
      setActiveChannel(channel)
    },
    [activeVoiceChannelId, voice]
  )

  const handleVoiceConnect = useCallback(async () => {
    setConnectingVoice(true)
    await voice.connect()
    if (activeChannel) setActiveVoiceChannelId(activeChannel.id)
    setConnectingVoice(false)
  }, [voice, activeChannel])

  const handleVoiceDisconnect = useCallback(async () => {
    await voice.disconnect()
    setActiveVoiceChannelId(null)
  }, [voice])

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!isSupabaseConfigured) return false
      return send(settings.userId, settings.username, content)
    },
    [send, settings.userId, settings.username]
  )

  if (loading) {
    return (
      <>
        <SpaceBackground animated={settings.animationsEnabled} />
        <ParticleField enabled={settings.showParticles} />
        <LoadingScreen />
      </>
    )
  }

  return (
    <div className="h-full flex relative">
      <SpaceBackground animated={settings.animationsEnabled} />
      <ParticleField enabled={settings.showParticles} />

      {showSetupBanner && (
        <SetupBanner onDismiss={() => setShowSetupBanner(false)} />
      )}

      <Sidebar
        serverName={serverName}
        channels={channels}
        activeChannelId={activeChannel?.type === 'text' ? activeChannel.id : null}
        activeVoiceChannelId={activeVoiceChannelId}
        onSelectChannel={handleSelectChannel}
        onOpenSettings={() => setSettingsOpen(true)}
        username={settings.username}
        animationsEnabled={settings.animationsEnabled}
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col min-w-0 relative"
      >
        <AnimatePresence mode="wait">
          {activeChannel?.type === 'text' ? (
            <motion.div
              key={`text-${activeChannel.id}`}
              initial={settings.animationsEnabled ? { opacity: 0, x: 20 } : false}
              animate={{ opacity: 1, x: 0 }}
              exit={settings.animationsEnabled ? { opacity: 0, x: -20 } : undefined}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col h-full"
            >
              <ChatArea
                channelName={activeChannel.name}
                messages={messages}
                loading={messagesLoading}
                sending={sending}
                currentUserId={settings.userId}
                onSend={handleSendMessage}
                animationsEnabled={settings.animationsEnabled}
              />
            </motion.div>
          ) : activeChannel?.type === 'voice' ? (
            <motion.div
              key={`voice-${activeChannel.id}`}
              initial={settings.animationsEnabled ? { opacity: 0, x: 20 } : false}
              animate={{ opacity: 1, x: 0 }}
              exit={settings.animationsEnabled ? { opacity: 0, x: -20 } : undefined}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col h-full"
            >
              <VoicePanel
                channelName={activeChannel.name}
                participants={voice.participants}
                isConnected={voice.isConnected}
                isMuted={voice.isMuted}
                isDeafened={voice.isDeafened}
                error={voice.error}
                currentUserId={settings.userId}
                onConnect={handleVoiceConnect}
                onDisconnect={handleVoiceDisconnect}
                onToggleMute={voice.toggleMute}
                onToggleDeafen={voice.toggleDeafen}
                connecting={connectingVoice}
                animationsEnabled={settings.animationsEnabled}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.main>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal
            settings={settings}
            onUpdate={updateSettings}
            onClose={() => setSettingsOpen(false)}
            animationsEnabled={settings.animationsEnabled}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
