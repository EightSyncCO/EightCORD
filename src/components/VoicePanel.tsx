import { motion } from 'framer-motion'
import {
  Mic, MicOff, Headphones, Volume2, VolumeX, PhoneOff, Phone,
  Users, AlertCircle, Loader2,
} from 'lucide-react'
import type { VoiceParticipant } from '../types'

interface VoicePanelProps {
  channelName: string
  participants: VoiceParticipant[]
  isConnected: boolean
  isMuted: boolean
  isDeafened: boolean
  error: string | null
  currentUserId: string
  onConnect: () => void
  onDisconnect: () => void
  onToggleMute: () => void
  onToggleDeafen: () => void
  connecting: boolean
  animationsEnabled: boolean
}

export function VoicePanel({
  channelName,
  participants,
  isConnected,
  isMuted,
  isDeafened,
  error,
  currentUserId,
  onConnect,
  onDisconnect,
  onToggleMute,
  onToggleDeafen,
  connecting,
  animationsEnabled,
}: VoicePanelProps) {
  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <motion.div
        initial={animationsEnabled ? { opacity: 0, y: -10 } : false}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4 border-b border-gray-800/50 glass-light"
      >
        <div className="flex items-center gap-2">
          <Volume2 size={18} className="text-green-400" />
          <h2 className="font-semibold text-gray-100">{channelName}</h2>
          {isConnected && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-green-500/20 text-green-400 rounded-full"
            >
              Подключён
            </motion.span>
          )}
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-lg mb-6"
          >
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {!isConnected ? (
          <motion.div
            initial={animationsEnabled ? { scale: 0.9, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border-glow"
            >
              <VolumeX size={40} className="text-gray-400" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">{channelName}</h3>
            <p className="text-gray-500 text-sm mb-8">Нажмите, чтобы присоединиться к голосовому каналу</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onConnect}
              disabled={connecting}
              className="flex items-center gap-2 mx-auto px-8 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl font-semibold transition-colors"
            >
              {connecting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Phone size={20} />
              )}
              {connecting ? 'Подключение...' : 'Присоединиться'}
            </motion.button>
          </motion.div>
        ) : (
          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 mb-6 text-gray-400">
              <Users size={16} />
              <span className="text-sm">
                Участники — {participants.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {participants.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={animationsEnabled ? { opacity: 0, scale: 0.8 } : false}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass-light rounded-xl p-4 flex items-center gap-3 ${
                    p.user_id === currentUserId ? 'border-glow' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center font-bold">
                      {p.username.charAt(0).toUpperCase()}
                    </div>
                    {!p.is_muted && (
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {p.username}
                      {p.user_id === currentUserId && (
                        <span className="text-gray-500 ml-1">(вы)</span>
                      )}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {p.is_muted && <MicOff size={12} className="text-red-400" />}
                      {p.is_deafened && <VolumeX size={12} className="text-red-400" />}
                      {!p.is_muted && !p.is_deafened && (
                        <span className="text-[10px] text-green-400">Говорит</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3">
              <ControlButton
                icon={isMuted ? MicOff : Mic}
                label={isMuted ? 'Включить мик' : 'Выключить мик'}
                active={isMuted}
                onClick={onToggleMute}
                color="red"
              />
              <ControlButton
                icon={isDeafened ? VolumeX : Headphones}
                label={isDeafened ? 'Включить звук' : 'Выключить звук'}
                active={isDeafened}
                onClick={onToggleDeafen}
                color="red"
              />
              <ControlButton
                icon={PhoneOff}
                label="Отключиться"
                active
                onClick={onDisconnect}
                color="red"
                large
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ControlButton({
  icon: Icon,
  label,
  active,
  onClick,
  color,
  large,
}: {
  icon: typeof Mic
  label: string
  active?: boolean
  onClick: () => void
  color?: string
  large?: boolean
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={label}
      className={`
        ${large ? 'w-14 h-14' : 'w-12 h-12'}
        rounded-full flex items-center justify-center transition-colors
        ${active && color === 'red'
          ? 'bg-red-600 hover:bg-red-500 text-white'
          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }
      `}
    >
      <Icon size={large ? 22 : 18} />
    </motion.button>
  )
}
