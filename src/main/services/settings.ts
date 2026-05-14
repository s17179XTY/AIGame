import { randomUUID } from 'crypto'
import { getDatabase } from '../database'
import { AppSettings, DEFAULT_SETTINGS, LLMConfig, DEFAULT_LLM_CONFIG } from './types'

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