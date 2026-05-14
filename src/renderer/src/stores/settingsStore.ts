import { create } from 'zustand'
import type { AppSettings as AppSettingsType, LLMConfig } from '../../../main/services/types'

const DEFAULT_SETTINGS: AppSettingsType = {
  activeLlmConfigId: null,
  apiKey: '',
  imageProvider: 'none',
  imageModel: 'dall-e-3',
  stabilityApiKey: '',
  imageFrequency: 'standard',
}

interface SettingsStore {
  settings: AppSettingsType
  configs: LLMConfig[]
  activeConfigId: string | null
  loaded: boolean
  loadSettings: () => Promise<void>
  updateSettings: (updates: Partial<AppSettingsType>) => Promise<void>
  loadConfigs: () => Promise<void>
  createConfig: (input: Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<LLMConfig>
  updateConfig: (id: string, patches: Partial<Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<LLMConfig>
  deleteConfig: (id: string) => Promise<void>
  setActiveConfig: (id: string | null) => Promise<void>
  pingConfig: (config: LLMConfig) => Promise<{ ok: boolean; latencyMs: number }>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  configs: [],
  activeConfigId: null,
  loaded: false,

  loadSettings: async () => {
    try {
      const settings = await window.api.settings.get()
      set({ settings, loaded: true })
    } catch {
      set({ loaded: true })
    }
    get().loadConfigs()
  },

  updateSettings: async (updates) => {
    const newSettings = await window.api.settings.update(updates)
    set({ settings: newSettings })
  },

  loadConfigs: async () => {
    try {
      const configs = await window.api.config.list()
      const settings = await window.api.settings.get()
      set({ configs, activeConfigId: settings.activeLlmConfigId })
    } catch {}
  },

  createConfig: async (input) => {
    const config = await window.api.config.create(input)
    await get().loadConfigs()
    return config
  },

  updateConfig: async (id, patches) => {
    const config = await window.api.config.update(id, patches)
    await get().loadConfigs()
    return config
  },

  deleteConfig: async (id) => {
    await window.api.config.delete(id)
    await get().loadConfigs()
  },

  setActiveConfig: async (id) => {
    await window.api.config.setActive(id)
    set({ activeConfigId: id })
  },

  pingConfig: async (config) => {
    return window.api.config.ping(config)
  },
}))