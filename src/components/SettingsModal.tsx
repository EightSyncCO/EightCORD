import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mic, Sparkles, Monitor, User } from 'lucide-react'
import { getAudioDevices } from '../lib/audio'
import type { UserSettings } from '../types'

interface SettingsModalProps {
  settings: UserSettings
  onUpdate: (partial: Partial<UserSettings>) => void
  onClose: () => void
  animationsEnabled: boolean
}

function Toggle({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-green-600' : 'bg-gray-700'
        }`}
      >
        <motion.div
          animate={{ x: enabled ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
        />
      </button>
    </div>
  )
}

function Slider({
  value,
  onChange,
  label,
  min = 0,
  max = 100,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  min?: number
  max?: number
}) {
  return (
    <div className="py-3">
      <div className="flex justify-between mb-2">
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <span className="text-xs text-gray-500">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-300
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
      />
    </div>
  )
}

export function SettingsModal({ settings, onUpdate, onClose, animationsEnabled }: SettingsModalProps) {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([])
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    getAudioDevices().then(({ inputs: i, outputs: o }) => {
      setInputs(i)
      setOutputs(o)
    })
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          initial={animationsEnabled ? { scale: 0.9, opacity: 0, y: 20 } : false}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto glass border-glow rounded-2xl"
        >
          <div className="sticky top-0 glass px-6 py-4 border-b border-gray-800/50 flex items-center justify-between z-10">
            <h2 className="font-display text-lg font-bold text-gray-100">Настройки</h2>
            <motion.button
              whileHover={{ rotate: 90 }}
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400"
            >
              <X size={20} />
            </motion.button>
          </div>

          <div className="px-6 py-4 space-y-2">
            <Section icon={User} title="Профиль">
              <div className="py-3">
                <label className="text-sm font-medium text-gray-200">Имя пользователя</label>
                <input
                  type="text"
                  value={settings.username}
                  onChange={(e) => onUpdate({ username: e.target.value })}
                  maxLength={32}
                  className="mt-2 w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-sm
                    outline-none focus:border-gray-500 transition-colors"
                  placeholder="Введите имя"
                />
              </div>
            </Section>

            <Section icon={Mic} title="Голос и видео">
              <Toggle
                enabled={settings.noiseSuppression}
                onChange={(v) => onUpdate({ noiseSuppression: v })}
                label="Шумоподавление"
                description="Убирает фоновый шум с микрофона (рекомендуется)"
              />
              <Toggle
                enabled={settings.echoCancellation}
                onChange={(v) => onUpdate({ echoCancellation: v })}
                label="Эхоподавление"
                description="Предотвращает эхо от динамиков"
              />
              <Toggle
                enabled={settings.autoGainControl}
                onChange={(v) => onUpdate({ autoGainControl: v })}
                label="Авторегулировка громкости"
                description="Автоматически выравнивает громкость микрофона"
              />

              <Slider
                label="Громкость микрофона"
                value={settings.inputVolume}
                onChange={(v) => onUpdate({ inputVolume: v })}
              />
              <Slider
                label="Громкость динамиков"
                value={settings.outputVolume}
                onChange={(v) => onUpdate({ outputVolume: v })}
              />

              {inputs.length > 0 && (
                <div className="py-3">
                  <label className="text-sm font-medium text-gray-200">Микрофон</label>
                  <select
                    value={settings.micDeviceId}
                    onChange={(e) => onUpdate({ micDeviceId: e.target.value })}
                    className="mt-2 w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-sm outline-none"
                  >
                    <option value="default">По умолчанию</option>
                    {inputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Микрофон ${d.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {outputs.length > 0 && (
                <div className="py-3">
                  <label className="text-sm font-medium text-gray-200">Динамики / наушники</label>
                  <select
                    value={settings.speakerDeviceId}
                    onChange={(e) => onUpdate({ speakerDeviceId: e.target.value })}
                    className="mt-2 w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-sm outline-none"
                  >
                    <option value="default">По умолчанию</option>
                    {outputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Динамик ${d.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </Section>

            <Section icon={Sparkles} title="Интерфейс">
              <Toggle
                enabled={settings.showParticles}
                onChange={(v) => onUpdate({ showParticles: v })}
                label="Частицы"
                description="Интерактивные частицы на фоне"
              />
              <Toggle
                enabled={settings.animationsEnabled}
                onChange={(v) => onUpdate({ animationsEnabled: v })}
                label="Анимации"
                description="Плавные переходы и эффекты"
              />
            </Section>

            <Section icon={Monitor} title="О приложении">
              <div className="py-3 text-sm text-gray-400 space-y-1">
                <p><span className="text-gray-300">ShowelGrays</span> v1.0.0</p>
                <p>Минималистичный голосовой и текстовый чат</p>
              </div>
            </Section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-gray-800/50 pb-2 mb-2 last:border-0">
      <div className="flex items-center gap-2 py-2">
        <Icon size={16} className="text-gray-500" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">{title}</h3>
      </div>
      {children}
    </div>
  )
}
