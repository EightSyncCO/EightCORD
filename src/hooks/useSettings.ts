import { useCallback, useEffect, useState } from 'react'
import { loadSettings, saveSettings, saveUsername, getDefaultSettings } from '../lib/audio'
import type { UserSettings } from '../types'

export function useSettings() {
  const [settings, setSettingsState] = useState<UserSettings>(getDefaultSettings)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setSettingsState(loadSettings())
  }, [])

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial }
      saveSettings(next)
      if (partial.username !== undefined) {
        saveUsername(partial.username)
      }
      return next
    })
  }, [])

  return { settings, updateSettings, isOpen, setIsOpen }
}
