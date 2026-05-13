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