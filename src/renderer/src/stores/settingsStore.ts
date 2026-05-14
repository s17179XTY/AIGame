import { create } from 'zustand'
import type { AppSettings as AppSettingsType, LLMConfig, ImageConfig, VoiceConfig } from '../../../main/services/types'

const DEFAULT_SETTINGS: AppSettingsType = {
  activeLlmConfigId: null,
  activeImageConfigId: null,
  activeVoiceConfigId: null,
  imageFrequency: 'standard',
  autoPlayVoice: true,
  language: 'zh-TW',
}

interface SettingsStore {
  settings: AppSettingsType
  configs: LLMConfig[]
  imageConfigs: ImageConfig[]
  voiceConfigs: VoiceConfig[]
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

  loadImageConfigs: () => Promise<void>
  createImageConfig: (input: Omit<ImageConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ImageConfig>
  updateImageConfig: (id: string, patches: Partial<Omit<ImageConfig, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<ImageConfig>
  deleteImageConfig: (id: string) => Promise<void>
  setActiveImageConfig: (id: string | null) => Promise<void>
  pingImageConfig: (config: ImageConfig) => Promise<{ ok: boolean; latencyMs: number }>

  loadVoiceConfigs: () => Promise<void>
  createVoiceConfig: (input: Omit<VoiceConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VoiceConfig>
  updateVoiceConfig: (id: string, patches: Partial<Omit<VoiceConfig, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<VoiceConfig>
  deleteVoiceConfig: (id: string) => Promise<void>
  setActiveVoiceConfig: (id: string | null) => Promise<void>
  pingVoiceConfig: (config: VoiceConfig) => Promise<{ ok: boolean; latencyMs: number }>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  configs: [],
  imageConfigs: [],
  voiceConfigs: [],
  activeConfigId: null,
  loaded: false,

  loadSettings: async () => {
    try {
      const settings = await window.api.settings.get()
      // Fallback: coerce empty strings to null for config IDs
      if (settings.activeLlmConfigId === '') settings.activeLlmConfigId = null
      if (settings.activeImageConfigId === '') settings.activeImageConfigId = null
      if (settings.activeVoiceConfigId === '') settings.activeVoiceConfigId = null
      set({ settings, loaded: true })
    } catch {
      set({ loaded: true })
    }
    get().loadConfigs()
    get().loadImageConfigs()
    get().loadVoiceConfigs()
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
    get().loadImageConfigs()
    get().loadVoiceConfigs()
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

  // --- Image Configs ---
  loadImageConfigs: async () => {
    try {
      const imageConfigs = await window.api.config.image.list()
      set({ imageConfigs })
    } catch {}
  },

  createImageConfig: async (input) => {
    const config = await window.api.config.image.create(input)
    await get().loadImageConfigs()
    return config
  },

  updateImageConfig: async (id, patches) => {
    const config = await window.api.config.image.update(id, patches)
    await get().loadImageConfigs()
    return config
  },

  deleteImageConfig: async (id) => {
    await window.api.config.image.delete(id)
    await get().loadImageConfigs()
  },

  setActiveImageConfig: async (id) => {
    await window.api.config.image.setActive(id)
    set((s) => ({ settings: { ...s.settings, activeImageConfigId: id } }))
  },

  pingImageConfig: async (config) => {
    return window.api.config.image.ping(config)
  },

  // --- Voice Configs ---
  loadVoiceConfigs: async () => {
    try {
      const voiceConfigs = await window.api.config.voice.list()
      set({ voiceConfigs })
    } catch {}
  },

  createVoiceConfig: async (input) => {
    const config = await window.api.config.voice.create(input)
    await get().loadVoiceConfigs()
    return config
  },

  updateVoiceConfig: async (id, patches) => {
    const config = await window.api.config.voice.update(id, patches)
    await get().loadVoiceConfigs()
    return config
  },

  deleteVoiceConfig: async (id) => {
    await window.api.config.voice.delete(id)
    await get().loadVoiceConfigs()
  },

  setActiveVoiceConfig: async (id) => {
    await window.api.config.voice.setActive(id)
    set((s) => ({ settings: { ...s.settings, activeVoiceConfigId: id } }))
  },

  pingVoiceConfig: async (config) => {
    return window.api.config.voice.ping(config)
  },
}))