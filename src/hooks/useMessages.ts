import { useCallback, useEffect, useState } from 'react'
import { fetchMessages, sendMessage, subscribeToMessages } from '../lib/supabase'
import type { Message } from '../types'

export function useMessages(channelId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!channelId) {
      setMessages([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetchMessages(channelId).then((msgs) => {
      setMessages(msgs)
      setLoading(false)
    })
    const unsubscribe = subscribeToMessages(channelId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })
    return unsubscribe
  }, [channelId])

  const send = useCallback(
    async (userId: string, username: string, content: string) => {
      if (!channelId || !content.trim()) return false
      setSending(true)
      const msg = await sendMessage(channelId, userId, username, content.trim())
      setSending(false)
      return msg !== null
    },
    [channelId]
  )

  return { messages, loading, sending, send }
}
