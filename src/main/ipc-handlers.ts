import { ipcMain } from 'electron'
import { IPC_CHANNELS, WorldConfig } from './services/types'
import { createWorld, getWorld, listWorlds, updateWorld, deleteWorld, getWorldState } from './services/world'
import { createCharacter, getCharacter, listCharacters, updateCharacter, deleteCharacter } from './services/character'
import { processGameAction, getStoryLog } from './services/game'
import { getSettings, updateSettings, testLLMConnection, listConfigs, getConfig, createConfig, updateConfig, deleteConfig, setActiveConfig, getActiveConfig, pingConfig } from './services/settings'
import { OpenAIImageProvider, StabilityImageProvider } from './services/image'

export function registerIpcHandlers(): void {
  // ---- World handlers ----
  ipcMain.handle(IPC_CHANNELS.WORLD_CREATE, (_event, config: WorldConfig) => {
    return createWorld(config)
  })

  ipcMain.handle(IPC_CHANNELS.WORLD_GET, (_event, id: string) => {
    return getWorld(id)
  })

  ipcMain.handle(IPC_CHANNELS.WORLD_LIST, () => {
    return listWorlds()
  })

  ipcMain.handle(IPC_CHANNELS.WORLD_UPDATE, (_event, id: string, updates: Partial<WorldConfig>) => {
    return updateWorld(id, updates)
  })

  ipcMain.handle(IPC_CHANNELS.WORLD_DELETE, (_event, id: string) => {
    return deleteWorld(id)
  })

  ipcMain.handle(IPC_CHANNELS.WORLD_STATE_GET, (_event, worldId: string) => {
    return getWorldState(worldId)
  })

  // ---- Character handlers ----
  ipcMain.handle(IPC_CHANNELS.CHARACTER_CREATE, (_event, worldId: string, config: any, isPlayer: boolean, isDynamic: boolean) => {
    return createCharacter(worldId, config, isPlayer, isDynamic)
  })

  ipcMain.handle(IPC_CHANNELS.CHARACTER_GET, (_event, id: string) => {
    return getCharacter(id)
  })

  ipcMain.handle(IPC_CHANNELS.CHARACTER_LIST, (_event, worldId: string) => {
    return listCharacters(worldId)
  })

  ipcMain.handle(IPC_CHANNELS.CHARACTER_UPDATE, (_event, id: string, updates: any) => {
    return updateCharacter(id, updates)
  })

  ipcMain.handle(IPC_CHANNELS.CHARACTER_DELETE, (_event, id: string) => {
    return deleteCharacter(id)
  })

  ipcMain.handle(IPC_CHANNELS.CHARACTER_GENERATE_AVATAR, async (_event, characterId: string) => {
    const settings = getSettings()
    if (settings.imageProvider === 'none') {
      throw new Error('Image generation is not configured')
    }
    const character = getCharacter(characterId)
    if (!character) throw new Error('Character not found')

    const prompt = `Portrait of ${character.name}, ${character.gender}, ${character.age} years old. ${character.appearance}. ${character.personality}. High quality fantasy character portrait, digital art style.`

    let provider
    if (settings.imageProvider === 'openai') {
      const activeCfg = getActiveConfig()
      const imageKey = (activeCfg && activeCfg.provider === 'openai') ? activeCfg.apiKey : settings.apiKey
      provider = new OpenAIImageProvider(imageKey)
    } else if (settings.imageProvider === 'stability') {
      provider = new StabilityImageProvider(settings.stabilityApiKey)
    } else {
      throw new Error('Unsupported image provider')
    }

    const result = await provider.generate(prompt, { size: '1024x1024', quality: 'standard' })

    // Store visual anchor
    updateCharacter(characterId, {
      visualAnchor: {
        provider: settings.imageProvider,
        seed: result.seed ?? 0,
        promptTemplate: prompt,
        lastImagePath: result.imagePath,
      },
    })

    return result
  })

  // ---- Game handlers ----
  ipcMain.handle(IPC_CHANNELS.GAME_ACTION, async (_event, action: any) => {
    return processGameAction(action)
  })

  // ---- Image handlers ----
  ipcMain.handle(IPC_CHANNELS.IMAGE_GENERATE_SCENE, async (_event, prompt: string) => {
    const settings = getSettings()
    if (settings.imageProvider === 'none') {
      throw new Error('Image generation is not configured')
    }

    let provider
    if (settings.imageProvider === 'openai') {
      provider = new OpenAIImageProvider(settings.apiKey)
    } else if (settings.imageProvider === 'stability') {
      provider = new StabilityImageProvider(settings.stabilityApiKey)
    } else {
      throw new Error('Unsupported image provider')
    }

    return provider.generate(prompt, { size: '1792x1024', quality: 'hd' })
  })


  // ---- Settings test handler ----
  ipcMain.handle(IPC_CHANNELS.SETTINGS_TEST_LLM, async (_event, provider: string, apiKey: string, model: string, baseUrl?: string) => {
    return testLLMConnection(provider, apiKey, model, baseUrl)
  })
  // ---- Settings handlers ----
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return getSettings()
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, (_event, updates: any) => {
    return updateSettings(updates)
  })


  // ---- LLM Config handlers ----
  ipcMain.handle(IPC_CHANNELS.CONFIG_LIST, () => {
    return listConfigs()
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, (_event, id: string) => {
    return getConfig(id)
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_CREATE, (_event, input: any) => {
    return createConfig(input)
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_UPDATE, (_event, id: string, patches: any) => {
    return updateConfig(id, patches)
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_DELETE, (_event, id: string) => {
    return deleteConfig(id)
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_SET_ACTIVE, (_event, id: string | null) => {
    setActiveConfig(id)
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_PING, async (_event, config: any) => {
    return pingConfig(config)
  })
  // ---- Story handlers ----
  ipcMain.handle(IPC_CHANNELS.STORY_GET_LOG, (_event, worldId: string, limit: number, offset: number) => {
    return getStoryLog(worldId, limit, offset)
  })

  ipcMain.handle(IPC_CHANNELS.STORY_GET_SNAPSHOT, (_event, worldId: string) => {
    return getWorldState(worldId)
  })
}