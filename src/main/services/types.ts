// ============================================================
// Core Type Definitions for AI Novel Game
// ============================================================

// --- World Types ---

export interface WorldConfig {
  name: string
  worldview: string
  rules: string
  systemPrompt: string
  initialScene: string
  simulationSpeed?: 'slow' | 'medium' | 'fast'
}

export interface World {
  id: string
  name: string
  config: WorldConfig
  createdAt: string
  updatedAt: string
}

export interface WorldState {
  id: string
  worldId: string
  scene: string
  time: string
  weather: string
  characterEmotions: Record<string, string>
  relationships: Relationship[]
  recentEvents: string[]
  lastImageContext: ImageContext | null
  updatedAt: string
}

export interface Relationship {
  characterA: string
  characterB: string
  relation: string
  description: string
}

export interface ImageContext {
  sceneDescription: string
  charactersPresent: string[]
  weather: string
  time: string
  keyAction: string
}

// --- Character Types ---

export interface CharacterConfig {
  name: string
  nickname?: string
  gender: string
  age: number
  appearance: string
  personality: string
  extraPrompt: string
  imagePath?: string
}

export interface Character {
  id: string
  worldId: string
  name: string
  nickname?: string
  gender: string
  age: number
  appearance: string
  personality: string
  extraPrompt: string
  imagePath?: string
  isPlayer: boolean
  isDynamic: boolean
  isLocked: boolean
  visualAnchor: VisualAnchor | null
  createdAt: string
}

export interface VisualAnchor {
  provider: string
  seed: number
  promptTemplate: string
  lastImagePath: string | null
}

// --- LLM Types ---

export type LLMProviderType = 'openai' | 'anthropic' | 'gemini'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMOptions {
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  responseFormat?: 'text' | 'json_object'
}

export interface LLMResponse {
  text: string
  usage?: {
    promptTokens: number
    completionTokens: number
  }
}

// --- Structured LLM Output ---

export interface StructuredLLMOutput {
  narration: string
  dialogues: DialogueEntry[]
  stateUpdate: StateUpdate
  imageTrigger?: ImageTrigger
  newCharacters?: NewCharacterRequest[]
}

export interface DialogueEntry {
  speakerId: string
  speakerName: string
  type: 'dialogue' | 'monologue' | 'action'
  content: string
  emotion: string
}

export interface StateUpdate {
  sceneChanged: boolean
  newScene?: string
  timeAdvanced: string
  weatherChanged: boolean
  newWeather?: string
  emotionUpdates: Record<string, string>
  relationshipUpdates: RelationshipUpdate[]
  newEvents: string[]
}

export interface RelationshipUpdate {
  characterA: string
  characterB: string
  newRelation: string
  description: string
}

export interface ImageTrigger {
  shouldGenerate: boolean
  level: 'scene' | 'behavior' | 'none'
  sceneDescription: string
  charactersPresent: string[]
  keyAction: string
}

export interface NewCharacterRequest {
  name: string
  gender: string
  age: number
  appearance: string
  personality: string
  role: string
  relationToExisting: string
}

// --- Image Types ---

export type ImageProviderType = 'openai' | 'stability'

export interface ImageOptions {
  size?: string
  style?: string
  seed?: number
  quality?: string
}

export interface ImageResult {
  imagePath: string
  seed?: number
  revisedPrompt?: string
}

// --- Story Log Types ---

export interface StoryEntry {
  id: string
  worldId: string
  sequence: number
  speakerId: string | null
  speakerName: string
  content: string
  type: 'dialogue' | 'monologue' | 'narration' | 'action'
  emotion: string
  imageTriggerContext: ImageContext | null
  imagePath: string | null
  createdAt: string
}

// --- LLM Config Types ---

export interface LLMConfig {
  id: string
  name: string
  provider: LLMProviderType
  model: string
  apiKey: string
  apiBaseUrl: string
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  createdAt: string
  updatedAt: string
}


// --- Image Config Types ---

export interface ImageConfig {
  id: string
  name: string
  provider: ImageProviderType
  model: string
  apiKey: string
  apiBaseUrl: string
  size: string
  quality: string
  createdAt: string
  updatedAt: string
}

export const DEFAULT_IMAGE_CONFIG: Omit<ImageConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Default',
  provider: 'openai',
  model: 'dall-e-3',
  apiKey: '',
  apiBaseUrl: '',
  size: '1024x1024',
  quality: 'standard',
}

export const DEFAULT_LLM_CONFIG: Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Default',
  provider: 'openai',
  model: 'gpt-4o',
  apiKey: '',
  apiBaseUrl: '',
  temperature: 0.8,
  maxTokens: 4096,
  topP: 1.0,
  frequencyPenalty: 0,
  presencePenalty: 0,
}


// --- Voice Types ---

export type VoiceProviderType = 'openai'

export interface VoiceConfig {
  id: string
  name: string
  provider: VoiceProviderType
  model: string
  apiKey: string
  voice: string
  speed: number
  createdAt: string
  updatedAt: string
}

export const DEFAULT_VOICE_CONFIG: Omit<VoiceConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Default',
  provider: 'openai',
  model: 'tts-1',
  apiKey: '',
  voice: 'alloy',
  speed: 1.0,
}

export interface TTSOptions {
  text: string
  voice?: string
  speed?: number
  model?: string
}

export interface TTSResult {
  audioPath: string
  format: string
}

// --- Settings Types ---

export interface AppSettings {
  activeLlmConfigId: string | null
  activeImageConfigId: string | null
  activeVoiceConfigId: string | null
  imageFrequency: 'conservative' | 'standard' | 'rich'
  autoPlayVoice: boolean
  imageEnabled: boolean
  voiceEnabled: boolean
  language: 'zh-TW' | 'en' | 'ja'
}

export const DEFAULT_SETTINGS: AppSettings = {
  activeLlmConfigId: null,
  activeImageConfigId: null,
  activeVoiceConfigId: null,
  imageFrequency: 'standard',
  autoPlayVoice: true,
  imageEnabled: true,
  voiceEnabled: true,
  language: 'zh-TW',
}

// --- Game Types ---

export interface GameAction {
  worldId: string
  playerInput: string
  actionType?: 'dialogue' | 'gm-command' | 'free-action'
  requestImageGeneration?: boolean
}

export interface GMCommandResponse {
  success: boolean
  message: string
  worldConfigPatch?: Partial<WorldConfig>
  characterPatches?: Array<{ id: string; updates: Partial<CharacterConfig> }>
  newScene?: string
  newTime?: string
  newWeather?: string
}

export interface GameResponse {
  entries: StoryEntry[]
  narration: string
  stateUpdate: StateUpdate
  imageTrigger?: ImageTrigger
  newCharacterRequests?: NewCharacterRequest[]
}

// --- IPC Channel Names ---

export const IPC_CHANNELS = {
  // World
  WORLD_CREATE: 'world:create',
  WORLD_GET: 'world:get',
  WORLD_LIST: 'world:list',
  WORLD_UPDATE: 'world:update',
  WORLD_DELETE: 'world:delete',
  WORLD_STATE_GET: 'world:state:get',
  WORLD_PREVIEW_GENERATE: 'world:preview:generate',

  // Character
  CHARACTER_CREATE: 'character:create',
  CHARACTER_GET: 'character:get',
  CHARACTER_LIST: 'character:list',
  CHARACTER_UPDATE: 'character:update',
  CHARACTER_DELETE: 'character:delete',
  CHARACTER_GENERATE_AVATAR: 'character:generate-avatar',
  CHARACTER_UPLOAD_IMAGE: 'character:upload-image',
  CHARACTER_LIST_GLOBAL: 'character:list-global',
  CHARACTER_ASSIGN_WORLD: 'character:assign-world',
  CHARACTER_AUTO_FILL: 'character:auto-fill',

  // Game
  GAME_ACTION: 'game:action',
  GAME_NEW_CHARACTER_CONFIRM: 'game:new-character-confirm',
  GAME_GM_ACTION: 'game:gm-action',
  GAME_START: 'game:start',
  WORLD_AUTO_FILL: 'world:auto-fill',

  // Image
  IMAGE_GENERATE_SCENE: 'image:generate-scene',
  IMAGE_CHECK_STATUS: 'image:check-status',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_TEST_LLM: 'settings:test-llm',
  SETTINGS_UPDATE: 'settings:update',

  // LLM Configs
  CONFIG_LIST: 'config:list',
  CONFIG_GET: 'config:get',
  CONFIG_CREATE: 'config:create',
  CONFIG_UPDATE: 'config:update',
  CONFIG_DELETE: 'config:delete',
  CONFIG_SET_ACTIVE: 'config:set-active',
  CONFIG_PING: 'config:ping',

  // Image Configs
  CONFIG_IMAGE_LIST: 'config:image:list',
  CONFIG_IMAGE_GET: 'config:image:get',
  CONFIG_IMAGE_CREATE: 'config:image:create',
  CONFIG_IMAGE_UPDATE: 'config:image:update',
  CONFIG_IMAGE_DELETE: 'config:image:delete',
  CONFIG_IMAGE_SET_ACTIVE: 'config:image:set-active',
  CONFIG_IMAGE_PING: 'config:image:ping',

  // Voice Configs
  CONFIG_VOICE_LIST: 'config:voice:list',
  CONFIG_VOICE_GET: 'config:voice:get',
  CONFIG_VOICE_CREATE: 'config:voice:create',
  CONFIG_VOICE_UPDATE: 'config:voice:update',
  CONFIG_VOICE_DELETE: 'config:voice:delete',
  CONFIG_VOICE_SET_ACTIVE: 'config:voice:set-active',
  CONFIG_VOICE_PING: 'config:voice:ping',

  // Voice TTS
  VOICE_TTS: 'voice:tts',

  // Story
  STORY_GET_LOG: 'story:get-log',
  STORY_GET_SNAPSHOT: 'story:get-snapshot',
  STORY_DELETE_ENTRY: 'story:delete-entry',
  STORY_DELETE_AFTER: 'story:delete-after',
} as const
