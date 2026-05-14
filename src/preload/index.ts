import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // World
  world: {
    create: (config: any) => ipcRenderer.invoke('world:create', config),
    get: (id: string) => ipcRenderer.invoke('world:get', id),
    list: () => ipcRenderer.invoke('world:list'),
    update: (id: string, updates: any) => ipcRenderer.invoke('world:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('world:delete', id),
    getState: (worldId: string) => ipcRenderer.invoke('world:state:get', worldId),
  },

  // Character
  character: {
    create: (worldId: string, config: any, isPlayer?: boolean, isDynamic?: boolean) =>
      ipcRenderer.invoke('character:create', worldId, config, isPlayer ?? false, isDynamic ?? false),
    get: (id: string) => ipcRenderer.invoke('character:get', id),
    list: (worldId: string) => ipcRenderer.invoke('character:list', worldId),
    update: (id: string, updates: any) => ipcRenderer.invoke('character:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('character:delete', id),
    generateAvatar: (characterId: string) => ipcRenderer.invoke('character:generate-avatar', characterId),
    uploadImage: (characterId: string, sourcePath: string) => ipcRenderer.invoke('character:upload-image', characterId, sourcePath),
  },

  // Game
  game: {
    sendAction: (action: any) => ipcRenderer.invoke('game:action', action),
    sendGMCommand: (worldId: string, command: string) => ipcRenderer.invoke('game:gm-action', worldId, command),
  },

  // Image
  image: {
    generateScene: (prompt: string) => ipcRenderer.invoke('image:generate-scene', prompt),
  },

  // Voice
  voice: {
    tts: (text: string) => ipcRenderer.invoke('voice:tts', text),
  },

  // Settings
  settings: {
    testLLM: (provider: string, apiKey: string, model: string, baseUrl?: string) =>
      ipcRenderer.invoke('settings:test-llm', provider, apiKey, model, baseUrl),

    get: () => ipcRenderer.invoke('settings:get'),
    update: (updates: any) => ipcRenderer.invoke('settings:update', updates),
  },

  // Configs (LLM, Image, Voice)
  config: {
    // LLM
    list: () => ipcRenderer.invoke('config:list'),
    get: (id: string) => ipcRenderer.invoke('config:get', id),
    create: (input: any) => ipcRenderer.invoke('config:create', input),
    update: (id: string, patches: any) => ipcRenderer.invoke('config:update', id, patches),
    delete: (id: string) => ipcRenderer.invoke('config:delete', id),
    setActive: (id: string | null) => ipcRenderer.invoke('config:set-active', id),
    ping: (config: any) => ipcRenderer.invoke('config:ping', config),

    // Image
    image: {
      list: () => ipcRenderer.invoke('config:image:list'),
      get: (id: string) => ipcRenderer.invoke('config:image:get', id),
      create: (input: any) => ipcRenderer.invoke('config:image:create', input),
      update: (id: string, patches: any) => ipcRenderer.invoke('config:image:update', id, patches),
      delete: (id: string) => ipcRenderer.invoke('config:image:delete', id),
      setActive: (id: string | null) => ipcRenderer.invoke('config:image:set-active', id),
      ping: (config: any) => ipcRenderer.invoke('config:image:ping', config),
    },

    // Voice
    voice: {
      list: () => ipcRenderer.invoke('config:voice:list'),
      get: (id: string) => ipcRenderer.invoke('config:voice:get', id),
      create: (input: any) => ipcRenderer.invoke('config:voice:create', input),
      update: (id: string, patches: any) => ipcRenderer.invoke('config:voice:update', id, patches),
      delete: (id: string) => ipcRenderer.invoke('config:voice:delete', id),
      setActive: (id: string | null) => ipcRenderer.invoke('config:voice:set-active', id),
      ping: (config: any) => ipcRenderer.invoke('config:voice:ping', config),
    },
  },

  // Story
  story: {
    getLog: (worldId: string, limit?: number, offset?: number) =>
      ipcRenderer.invoke('story:get-log', worldId, limit ?? 100, offset ?? 0),
    getSnapshot: (worldId: string) => ipcRenderer.invoke('story:get-snapshot', worldId),
    deleteEntry: (id: string) => ipcRenderer.invoke('story:delete-entry', id),
    deleteAfter: (worldId: string, sequence: number) => ipcRenderer.invoke('story:delete-after', worldId, sequence),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api