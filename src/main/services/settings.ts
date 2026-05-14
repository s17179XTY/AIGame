import { randomUUID } from 'crypto'
import { getDatabase } from '../database'
import { AppSettings, DEFAULT_SETTINGS, LLMConfig, DEFAULT_LLM_CONFIG, ImageConfig, DEFAULT_IMAGE_CONFIG, VoiceConfig, DEFAULT_VOICE_CONFIG } from './types'

// ============================================================
// Global Settings (image + active config reference)
// ============================================================

export function getSettings(): AppSettings {
  const db = getDatabase()
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  const settings = { ...DEFAULT_SETTINGS }
  for (const row of rows) {
    if (row.key in settings) {
      ;(settings as Record<string, unknown>)[row.key] = row.value
    }
  }
  // Coerce DB string values to proper types
  if (settings.activeLlmConfigId === '') settings.activeLlmConfigId = null
  if (settings.activeImageConfigId === '') settings.activeImageConfigId = null
  if (settings.activeVoiceConfigId === '') settings.activeVoiceConfigId = null
  if ((settings as any).autoPlayVoice === 'true') (settings as any).autoPlayVoice = true
  if ((settings as any).autoPlayVoice === 'false') (settings as any).autoPlayVoice = false
  return settings
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const db = getDatabase()
  const upsert = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  )
  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      upsert.run(key, String(value ?? ''))
    }
  })
  transaction()
  return getSettings()
}

// ============================================================
// LLM Config CRUD
// ============================================================

export function listConfigs(): LLMConfig[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM llm_configs ORDER BY created_at ASC').all() as Record<string, unknown>[]
  return rows.map(rowToConfig)
}

export function getConfig(id: string): LLMConfig | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM llm_configs WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? rowToConfig(row) : undefined
}

export function createConfig(input: Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt'>): LLMConfig {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO llm_configs (id, name, provider, model, api_key, api_base_url, temperature, max_tokens, top_p, frequency_penalty, presence_penalty, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.name, input.provider, input.model, input.apiKey, input.apiBaseUrl,
    input.temperature, input.maxTokens, input.topP, input.frequencyPenalty, input.presencePenalty, now, now)

  // Auto-set as active if this is the first config
  const count = db.prepare('SELECT COUNT(*) as cnt FROM llm_configs').get() as { cnt: number }
  if (count.cnt === 1) {
    setActiveConfig(id)
  }

  return getConfig(id)!
}

export function updateConfig(id: string, patches: Partial<Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt'>>): LLMConfig {
  const db = getDatabase()
  const now = new Date().toISOString()
  const fieldMap: Record<string, string> = {
    name: 'name',
    provider: 'provider',
    model: 'model',
    apiKey: 'api_key',
    apiBaseUrl: 'api_base_url',
    temperature: 'temperature',
    maxTokens: 'max_tokens',
    topP: 'top_p',
    frequencyPenalty: 'frequency_penalty',
    presencePenalty: 'presence_penalty',
  }

  for (const [key, value] of Object.entries(patches)) {
    const col = fieldMap[key]
    if (col && value !== undefined) {
      db.prepare(`UPDATE llm_configs SET ${col} = ?, updated_at = ? WHERE id = ?`).run(value, now, id)
    }
  }

  return getConfig(id)!
}

export function deleteConfig(id: string): void {
  const db = getDatabase()
  // If deleting the active config, clear the reference
  const settings = getSettings()
  if (settings.activeLlmConfigId === id) {
    updateSettings({ activeLlmConfigId: null })
  }
  db.prepare('DELETE FROM llm_configs WHERE id = ?').run(id)
}

// ============================================================

// ============================================================
// Image Config CRUD
// ============================================================

export function listImageConfigs(): ImageConfig[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM image_configs ORDER BY created_at ASC').all() as Record<string, unknown>[]
  return rows.map(rowToImageConfig)
}

export function getImageConfig(id: string): ImageConfig | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM image_configs WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? rowToImageConfig(row) : undefined
}

export function createImageConfig(input: Omit<ImageConfig, 'id' | 'createdAt' | 'updatedAt'>): ImageConfig {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO image_configs (id, name, provider, model, api_key, api_base_url, size, quality, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, input.name, input.provider, input.model, input.apiKey, input.apiBaseUrl,
    input.size, input.quality, now, now)

  const count = db.prepare('SELECT COUNT(*) as cnt FROM image_configs').get() as { cnt: number }
  if (count.cnt === 1) {
    setActiveImageConfig(id)
  }

  return getImageConfig(id)!
}

export function updateImageConfig(id: string, patches: Partial<Omit<ImageConfig, 'id' | 'createdAt' | 'updatedAt'>>): ImageConfig {
  const db = getDatabase()
  const now = new Date().toISOString()
  const fieldMap: Record<string, string> = {
    name: 'name',
    provider: 'provider',
    model: 'model',
    apiKey: 'api_key',
    apiBaseUrl: 'api_base_url',
    size: 'size',
    quality: 'quality',
  }

  for (const [key, value] of Object.entries(patches)) {
    const col = fieldMap[key]
    if (col && value !== undefined) {
      db.prepare('UPDATE image_configs SET ' + col + ' = ?, updated_at = ? WHERE id = ?').run(value, now, id)
    }
  }

  return getImageConfig(id)!
}

export function deleteImageConfig(id: string): void {
  const db = getDatabase()
  const settings = getSettings()
  if (settings.activeImageConfigId === id) {
    updateSettings({ activeImageConfigId: null })
  }
  db.prepare('DELETE FROM image_configs WHERE id = ?').run(id)
}

export function setActiveImageConfig(id: string | null): void {
  updateSettings({ activeImageConfigId: id })
}

export function getActiveImageConfig(): ImageConfig | null {
  const settings = getSettings()
  if (settings.activeImageConfigId) {
    const config = getImageConfig(settings.activeImageConfigId)
    if (config) return config
  }
  const configs = listImageConfigs()
  if (configs.length > 0) {
    setActiveImageConfig(configs[0].id)
    return configs[0]
  }
  return null
}

export async function pingImageConfig(config: ImageConfig): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    if (config.provider === 'openai') {
      const OpenAI = (await import('openai')).default
      const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.apiBaseUrl || undefined })
      await client.models.retrieve(config.model || 'dall-e-3')
      return { ok: true, latencyMs: Date.now() - start }
    }
    if (config.provider === 'stability') {
      if (!config.apiKey) return { ok: false, latencyMs: Date.now() - start }
      const base = config.apiBaseUrl ? config.apiBaseUrl.replace(/\/+$/, '') : 'https://api.stability.ai'
      const resp = await fetch(base + '/v1/engines/list', {
        headers: { Authorization: 'Bearer ' + config.apiKey },
      })
      return { ok: resp.ok, latencyMs: Date.now() - start }
    }
    return { ok: false, latencyMs: Date.now() - start }
  } catch {
    return { ok: false, latencyMs: Date.now() - start }
  }
}

// ============================================================
// Voice Config CRUD
// ============================================================

export function listVoiceConfigs(): VoiceConfig[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM voice_configs ORDER BY created_at ASC').all() as Record<string, unknown>[]
  return rows.map(rowToVoiceConfig)
}

export function getVoiceConfig(id: string): VoiceConfig | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM voice_configs WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? rowToVoiceConfig(row) : undefined
}

export function createVoiceConfig(input: Omit<VoiceConfig, 'id' | 'createdAt' | 'updatedAt'>): VoiceConfig {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO voice_configs (id, name, provider, model, api_key, voice, speed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, input.name, input.provider, input.model, input.apiKey, input.voice, input.speed, now, now)

  const count = db.prepare('SELECT COUNT(*) as cnt FROM voice_configs').get() as { cnt: number }
  if (count.cnt === 1) {
    setActiveVoiceConfig(id)
  }

  return getVoiceConfig(id)!
}

export function updateVoiceConfig(id: string, patches: Partial<Omit<VoiceConfig, 'id' | 'createdAt' | 'updatedAt'>>): VoiceConfig {
  const db = getDatabase()
  const now = new Date().toISOString()
  const fieldMap: Record<string, string> = {
    name: 'name',
    provider: 'provider',
    model: 'model',
    apiKey: 'api_key',
    voice: 'voice',
    speed: 'speed',
  }

  for (const [key, value] of Object.entries(patches)) {
    const col = fieldMap[key]
    if (col && value !== undefined) {
      db.prepare('UPDATE voice_configs SET ' + col + ' = ?, updated_at = ? WHERE id = ?').run(value, now, id)
    }
  }

  return getVoiceConfig(id)!
}

export function deleteVoiceConfig(id: string): void {
  const db = getDatabase()
  const settings = getSettings()
  if (settings.activeVoiceConfigId === id) {
    updateSettings({ activeVoiceConfigId: null })
  }
  db.prepare('DELETE FROM voice_configs WHERE id = ?').run(id)
}

export function setActiveVoiceConfig(id: string | null): void {
  updateSettings({ activeVoiceConfigId: id })
}

export function getActiveVoiceConfig(): VoiceConfig | null {
  const settings = getSettings()
  if (settings.activeVoiceConfigId) {
    const config = getVoiceConfig(settings.activeVoiceConfigId)
    if (config) return config
  }
  const configs = listVoiceConfigs()
  if (configs.length > 0) {
    setActiveVoiceConfig(configs[0].id)
    return configs[0]
  }
  return null
}

export async function pingVoiceConfig(config: VoiceConfig): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    if (!config.apiKey) return { ok: false, latencyMs: Date.now() - start }
    if (config.provider === 'openai') {
      const OpenAI = (await import('openai')).default
      const client = new OpenAI({ apiKey: config.apiKey })
      await client.models.retrieve(config.model || 'tts-1')
      return { ok: true, latencyMs: Date.now() - start }
    }
    return { ok: false, latencyMs: Date.now() - start }
  } catch {
    return { ok: false, latencyMs: Date.now() - start }
  }
}

// Active Config
// ============================================================

export function setActiveConfig(id: string | null): void {
  updateSettings({ activeLlmConfigId: id })
}

export function getActiveConfig(): LLMConfig | null {
  const settings = getSettings()
  if (settings.activeLlmConfigId) {
    const config = getConfig(settings.activeLlmConfigId)
    if (config) return config
  }
  // Fallback: return first config if any exist
  const configs = listConfigs()
  if (configs.length > 0) {
    setActiveConfig(configs[0].id)
    return configs[0]
  }
  return null
}

// ============================================================
// Ping / Latency Test
// ============================================================

export async function pingConfig(config: LLMConfig): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    if (!config.apiKey && config.provider !== 'openai') {
      return { ok: false, latencyMs: Date.now() - start }
    }

    const model = config.model || 'gpt-4o-mini'
    const baseUrl = config.apiBaseUrl || undefined

    if (config.provider === 'openai') {
      const OpenAI = (await import('openai')).default
      const client = new OpenAI({ apiKey: config.apiKey || 'not-needed', ...(baseUrl ? { baseURL: baseUrl } : {}) })
      await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      })
      return { ok: true, latencyMs: Date.now() - start }
    }

    if (config.provider === 'anthropic') {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: config.apiKey, ...(baseUrl ? { baseURL: baseUrl } : {}) })
      await client.messages.create({
        model,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      return { ok: true, latencyMs: Date.now() - start }
    }

    if (config.provider === 'gemini') {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(config.apiKey)
      const geminiModel = genAI.getGenerativeModel({ model, ...(baseUrl ? { baseUrl } : {}) })
      await geminiModel.generateContent('Hi')
      return { ok: true, latencyMs: Date.now() - start }
    }

    return { ok: false, latencyMs: Date.now() - start }
  } catch {
    return { ok: false, latencyMs: Date.now() - start }
  }
}

// ============================================================
// Legacy test connection (kept for backward compat)
// ============================================================

export async function testLLMConnection(provider: string, apiKey: string, model: string, baseUrl?: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!apiKey) {
      return { success: false, message: 'API Key 未設定' }
    }

    const config: LLMConfig = {
      id: '',
      name: 'test',
      provider: provider as any,
      model,
      apiKey,
      apiBaseUrl: baseUrl || '',
      temperature: 0.8,
      maxTokens: 4096,
      topP: 1.0,
      frequencyPenalty: 0,
      presencePenalty: 0,
      createdAt: '',
      updatedAt: '',
    }

    const result = await pingConfig(config)
    if (result.ok) {
      return { success: true, message: `連線成功 (${result.latencyMs}ms)` }
    }
    return { success: false, message: `連線失敗 (${result.latencyMs}ms)` }
  } catch (err: any) {
    const msg = err?.message ?? err?.toString() ?? '未知錯誤'
    const shortMsg = msg.length > 150 ? msg.slice(0, 150) + '...' : msg
    return { success: false, message: `連線失敗: ${shortMsg}` }
  }
}

// ============================================================
// Helpers
// ============================================================


function rowToImageConfig(row: Record<string, unknown>): ImageConfig {
  return {
    id: row.id as string,
    name: row.name as string,
    provider: row.provider as ImageConfig['provider'],
    model: row.model as string,
    apiKey: row.api_key as string,
    apiBaseUrl: row.api_base_url as string,
    size: row.size as string,
    quality: row.quality as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function rowToVoiceConfig(row: Record<string, unknown>): VoiceConfig {
  return {
    id: row.id as string,
    name: row.name as string,
    provider: row.provider as VoiceConfig['provider'],
    model: row.model as string,
    apiKey: row.api_key as string,
    voice: row.voice as string,
    speed: row.speed as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}
function rowToConfig(row: Record<string, unknown>): LLMConfig {
  return {
    id: row.id as string,
    name: row.name as string,
    provider: row.provider as LLMConfig['provider'],
    model: row.model as string,
    apiKey: row.api_key as string,
    apiBaseUrl: row.api_base_url as string,
    temperature: row.temperature as number,
    maxTokens: row.max_tokens as number,
    topP: row.top_p as number,
    frequencyPenalty: row.frequency_penalty as number,
    presencePenalty: row.presence_penalty as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}