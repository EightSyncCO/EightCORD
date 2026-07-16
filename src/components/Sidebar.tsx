import { motion } from 'framer-motion'
import { Hash, Volume2, Settings, X } from 'lucide-react'
import type { Channel } from '../types'

interface SidebarProps {
  serverName: string
  channels: Channel[]
  activeChannelId: string | null
  activeVoiceChannelId: string | null
  onSelectChannel: (channel: Channel) => void
  onOpenSettings: () => void
  username: string
  animationsEnabled: boolean
}

export function Sidebar({
  serverName,
  channels,
  activeChannelId,
  activeVoiceChannelId,
  onSelectChannel,
  onOpenSettings,
  username,
  animationsEnabled,
}: SidebarProps) {
  const textChannels = channels.filter((c) => c.type === 'text')
  const voiceChannels = channels.filter((c) => c.type === 'voice')

  const ChannelButton = ({ channel, isActive }: { channel: Channel; isActive: boolean }) => {
    const Icon = channel.type === 'text' ? Hash : Volume2
    const isVoiceActive = channel.type === 'voice' && activeVoiceChannelId === channel.id

    return (
      <motion.button
        whileHover={animationsEnabled ? { x: 4, backgroundColor: 'rgba(107, 114, 128, 0.15)' } : undefined}
        whileTap={animationsEnabled ? { scale: 0.98 } : undefined}
        onClick={() => onSelectChannel(channel)}
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
          transition-colors duration-200 group relative
          ${isActive || isVoiceActive
            ? 'bg-gray-750 text-gray-100 border-glow'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }
        `}
      >
        <Icon size={16} className={`shrink-0 ${isVoiceActive ? 'text-green-400' : ''}`} />
        <span className="truncate">{channel.name}</span>
        {isVoiceActive && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse"
          />
        )}
      </motion.button>
    )
  }

  return (
    <motion.aside
      initial={animationsEnabled ? { x: -20, opacity: 0 } : false}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-64 h-full flex flex-col glass border-r border-gray-800/50"
    >
      <div className="p-4 border-b border-gray-800/50">
        <motion.h1
          initial={animationsEnabled ? { opacity: 0, y: -10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-lg font-bold text-gray-100 text-glow tracking-wider"
        >
          {serverName}
        </motion.h1>
        <p className="text-xs text-gray-500 mt-1">ShowelGrays</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 px-3 mb-2">
            Текстовые каналы
          </h3>
          <div className="space-y-0.5">
            {textChannels.map((ch) => (
              <ChannelButton key={ch.id} channel={ch} isActive={activeChannelId === ch.id} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 px-3 mb-2">
            Голосовые каналы
          </h3>
          <div className="space-y-0.5">
            {voiceChannels.map((ch) => (
              <ChannelButton key={ch.id} channel={ch} isActive={false} />
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-gray-800/50">
        <div className="flex items-center gap-2 glass-light rounded-lg p-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-xs font-bold">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{username}</p>
            <p className="text-[10px] text-gray-500">Online</p>
          </div>
          <motion.button
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
            onClick={onOpenSettings}
            className="p-1.5 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors"
            title="Настройки"
          >
            <Settings size={18} />
          </motion.button>
        </div>
      </div>
    </motion.aside>
  )
}

export function SetupBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass border-glow rounded-xl px-6 py-4 max-w-lg"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-100 mb-1">Supabase не настроен</h3>
          <p className="text-sm text-gray-400">
            Создайте файл <code className="text-gray-300 bg-gray-800 px-1 rounded">.env</code> с ключами Supabase.
            Подробная инструкция в README.md
          </p>
        </div>
        <button onClick={onDismiss} className="text-gray-500 hover:text-gray-300">
          <X size={18} />
        </button>
      </div>
    </motion.div>
  )
}
