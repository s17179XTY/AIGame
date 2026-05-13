import { randomUUID } from 'crypto'
import { getDatabase } from '../database'
import { World, WorldConfig, WorldState } from './types'

export function createWorld(config: WorldConfig): World {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    'INSERT INTO worlds (id, name, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, config.name, JSON.stringify(config), now, now)

  // Initialize world state
  db.prepare(
    `INSERT INTO world_state (id, world_id, scene, time, weather, character_emotions, relationships, recent_events, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    id,
    config.initialScene,
    '故事開始',
    '晴朗',
    '{}',
    '[]',
    '[]',
    now
  )

  return {
    id,
    name: config.name,
    config,
    createdAt: now,
    updatedAt: now,
  }
}

export function getWorld(id: string): World | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM worlds WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return null
  return rowToWorld(row)
}

export function listWorlds(): World[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM worlds ORDER BY updated_at DESC').all() as Record<string, unknown>[]
  return rows.map(rowToWorld)
}

export function updateWorld(id: string, updates: Partial<WorldConfig>): World | null {
  const db = getDatabase()
  const existing = getWorld(id)
  if (!existing) return null

  const newConfig = { ...existing.config, ...updates }
  const now = new Date().toISOString()

  db.prepare('UPDATE worlds SET name = ?, config = ?, updated_at = ? WHERE id = ?').run(
    updates.name ?? existing.name,
    JSON.stringify(newConfig),
    now,
    id
  )

  return getWorld(id)
}

export function deleteWorld(id: string): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM worlds WHERE id = ?').run(id)
  return result.changes > 0
}

export function getWorldState(worldId: string): WorldState | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM world_state WHERE world_id = ?').get(worldId) as Record<string, unknown> | undefined
  if (!row) return null
  return rowToWorldState(row)
}

export function updateWorldState(
  worldId: string,
  updates: Partial<Omit<WorldState, 'id' | 'worldId' | 'updatedAt'>>
): WorldState | null {
  const db = getDatabase()
  const existing = getWorldState(worldId)
  if (!existing) return null

  const now = new Date().toISOString()

  db.prepare(
    `UPDATE world_state SET
      scene = COALESCE(?, scene),
      time = COALESCE(?, time),
      weather = COALESCE(?, weather),
      character_emotions = COALESCE(?, character_emotions),
      relationships = COALESCE(?, relationships),
      recent_events = COALESCE(?, recent_events),
      last_image_context = COALESCE(?, last_image_context),
      updated_at = ?
     WHERE world_id = ?`
  ).run(
    updates.scene ?? null,
    updates.time ?? null,
    updates.weather ?? null,
    updates.characterEmotions ? JSON.stringify(updates.characterEmotions) : null,
    updates.relationships ? JSON.stringify(updates.relationships) : null,
    updates.recentEvents ? JSON.stringify(updates.recentEvents) : null,
    updates.lastImageContext ? JSON.stringify(updates.lastImageContext) : null,
    now,
    worldId
  )

  return getWorldState(worldId)
}

function rowToWorld(row: Record<string, unknown>): World {
  return {
    id: row.id as string,
    name: row.name as string,
    config: JSON.parse(row.config as string),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function rowToWorldState(row: Record<string, unknown>): WorldState {
  return {
    id: row.id as string,
    worldId: row.world_id as string,
    scene: row.scene as string,
    time: row.time as string,
    weather: row.weather as string,
    characterEmotions: JSON.parse(row.character_emotions as string),
    relationships: JSON.parse(row.relationships as string),
    recentEvents: JSON.parse(row.recent_events as string),
    lastImageContext: row.last_image_context ? JSON.parse(row.last_image_context as string) : null,
    updatedAt: row.updated_at as string,
  }
}