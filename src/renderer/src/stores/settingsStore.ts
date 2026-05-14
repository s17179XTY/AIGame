import { create } from 'zustand'
import type { AppSettings as AppSettingsType } from '../../../main/services/types'

const DEFAULT_SETTINGS: AppSettingsType = {
  llmProvider: 'openai',
  llmModel: 'gpt-4o',
  apiKey: '',
  apiBaseUrl: '',
  imageProvider: 'none',
  imageModel: 'dall-e-3',
  stabilityApiKey: '',
  imageFrequency: 'standard',
  temperature: 0.8,
  maxTokens: 4096,
  topP: 1.0,
  frequencyPenalty: 0,
  presencePenalty: 0,
}

interface SettingsStore {
  settings: AppSettingsType
  loaded: boolean
  loadSettings: () => Promise<void>
  updateSettings: (updates: Partial<AppSettingsType>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  loadSettings: async () => {
    try {
      const settings = await window.api.settings.get()
      set({ settings, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
  updateSettings: async (updates) => {
    const newSettings = await window.api.settings.update(updates)
    set({ settings: newSettings })
  },
}))