import { useEffect, useRef, useState, FormEvent, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'
import type { Message } from '../types'

interface ChatAreaProps {
  channelName: string
  messages: Message[]
  loading: boolean
  sending: boolean
  currentUserId: string
  onSend: (content: string) => Promise<boolean>
  animationsEnabled: boolean
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Сегодня'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера'
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function ChatArea({
  channelName,
  messages,
  loading,
  sending,
  currentUserId,
  onSend,
  animationsEnabled,
}: ChatAreaProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || sending) return
    const text = input
    setInput('')
    const ok = await onSend(text)
    if (!ok) setInput(text)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  let lastDate = ''

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <motion.div
        initial={animationsEnabled ? { opacity: 0, y: -10 } : false}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4 border-b border-gray-800/50 glass-light"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-500">#</span>
          <h2 className="font-semibold text-gray-100">{channelName}</h2>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-gray-500" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-gray-500"
          >
            <p className="text-lg">Начните общение!</p>
            <p className="text-sm mt-1">Это начало канала #{channelName}</p>
          </motion.div>
        ) : (
          <div className="space-y-1 max-w-3xl">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const msgDate = formatDate(msg.created_at)
                const showDate = msgDate !== lastDate
                lastDate = msgDate
                const isOwn = msg.user_id === currentUserId

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-800" />
                        <span className="text-xs text-gray-500 font-medium">{msgDate}</span>
                        <div className="flex-1 h-px bg-gray-800" />
                      </div>
                    )}
                    <motion.div
                      initial={animationsEnabled ? { opacity: 0, x: isOwn ? 10 : -10 } : false}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-800/30 group transition-colors ${
                        isOwn ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${
                          msg.user_id === 'system'
                            ? 'bg-gradient-to-br from-gray-500 to-gray-700'
                            : 'bg-gradient-to-br from-gray-600 to-gray-800'
                        }`}
                      >
                        {msg.username.charAt(0).toUpperCase()}
                      </div>
                      <div className={`min-w-0 ${isOwn ? 'text-right' : ''}`}>
                        <div className={`flex items-baseline gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <span className="font-semibold text-sm text-gray-200 hover:underline cursor-pointer">
                            {msg.username}
                          </span>
                          <span className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 break-words whitespace-pre-wrap mt-0.5">
                          {msg.content}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                )
              })}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-4 pb-4">
        <motion.div
          whileFocus={{ scale: 1.005 }}
          className="glass-light rounded-xl flex items-end gap-2 p-2 border-glow"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Написать в #${channelName}`}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-200 placeholder-gray-600 px-2 py-2 max-h-32"
            style={{ minHeight: '40px' }}
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || sending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </motion.button>
        </motion.div>
      </form>
    </div>
  )
}
