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
  gender: string
  age: number
  appearance: string
  personality: string
  extraPrompt: string
}

export interface Character {
  id: string
  worldId: string
  name: string
  gender: string
  age: number
  appearance: string
  personality: string
  extraPrompt: string
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

// --- Settings Types ---

export interface AppSettings {
  llmProvider: LLMProviderType
  llmModel: string
  apiKey: string
  apiBaseUrl: string
  imageProvider: ImageProviderType | 'none'
  imageModel: string
  stabilityApiKey: string
  imageFrequency: 'conservative' | 'standard' | 'rich'
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
}

export const DEFAULT_SETTINGS: AppSettings = {
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

// --- Game Types ---

export interface GameAction {
  worldId: string
  playerInput: string
  requestImageGeneration?: boolean
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

  // Game
  GAME_ACTION: 'game:action',
  GAME_NEW_CHARACTER_CONFIRM: 'game:new-character-confirm',

  // Image
  IMAGE_GENERATE_SCENE: 'image:generate-scene',
  IMAGE_CHECK_STATUS: 'image:check-status',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_TEST_LLM: 'settings:test-llm',
  SETTINGS_UPDATE: 'settings:update',

  // Story
  STORY_GET_LOG: 'story:get-log',
  STORY_GET_SNAPSHOT: 'story:get-snapshot',
} as const
