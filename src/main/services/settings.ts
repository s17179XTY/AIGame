import { getDatabase } from '../database'
import { AppSettings, DEFAULT_SETTINGS } from './types'

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
      upsert.run(key, String(value))
    }
  })

  transaction()
  return getSettings()
}
export async function testLLMConnection(provider: string, apiKey: string, model: string, baseUrl?: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!apiKey) {
      return { success: false, message: 'API Key 未設定' }
    }

    const fallbackModel = provider === 'anthropic' ? 'claude-3-haiku-20240307' : provider === 'gemini' ? 'gemini-2.0-flash-lite' : 'gpt-4o-mini'
    const useModel = model || fallbackModel

    if (provider === 'openai') {
      const OpenAI = (await import('openai')).default
      const client = new OpenAI({ apiKey, ...(baseUrl ? { baseURL: baseUrl } : {}) })
      await client.chat.completions.create({
        model: useModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      })
      return { success: true, message: 'OpenAI 連線成功' }
    }

    if (provider === 'anthropic') {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey, ...(baseUrl ? { baseURL: baseUrl } : {}) })
      await client.messages.create({
        model: useModel,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      return { success: true, message: 'Anthropic 連線成功' }
    }

    if (provider === 'gemini') {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey, baseUrl ? { baseUrl } : undefined)
      const geminiModel = genAI.getGenerativeModel({ model: useModel })
      await geminiModel.generateContent('Hi')
      return { success: true, message: 'Gemini 連線成功' }
    }

    return { success: false, message: `不支援的 provider: ${provider}` }
  } catch (err: any) {
    const msg = err?.message ?? err?.toString() ?? '未知錯誤'
    const shortMsg = msg.length > 150 ? msg.slice(0, 150) + '...' : msg
    return { success: false, message: `連線失敗: ${shortMsg}` }
  }
}