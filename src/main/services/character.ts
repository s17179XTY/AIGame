import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database'
import { Character, CharacterConfig, VisualAnchor } from './types'

export function createCharacter(
  worldId: string,
  config: CharacterConfig,
  isPlayer: boolean = false,
  isDynamic: boolean = false
): Character {
  const db = getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO characters (id, world_id, name, gender, age, appearance, personality, extra_prompt, is_player, is_dynamic, is_locked, visual_anchor, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    worldId,
    config.name,
    config.gender,
    config.age,
    config.appearance,
    config.personality,
    config.extraPrompt,
    isPlayer ? 1 : 0,
    isDynamic ? 1 : 0,
    0,
    null,
    now
  )

  return {
    id,
    worldId,
    ...config,
    isPlayer,
    isDynamic,
    isLocked: false,
    visualAnchor: null,
    createdAt: now,
  }
}

export function getCharacter(id: string): Character | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return null
  return rowToCharacter(row)
}

export function listCharacters(worldId: string): Character[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM characters WHERE world_id = ? ORDER BY is_player DESC, created_at ASC').all(worldId) as Record<string, unknown>[]
  return rows.map(rowToCharacter)
}

export function getPlayerCharacter(worldId: string): Character | null {
  const db = getDatabase()
  const row = db.prepare(
    'SELECT * FROM characters WHERE world_id = ? AND is_player = 1'
  ).get(worldId) as Record<string, unknown> | undefined
  if (!row) return null
  return rowToCharacter(row)
}

export function updateCharacter(id: string, updates: Partial<CharacterConfig & { isLocked: boolean; visualAnchor: VisualAnchor | null }>): Character | null {
  const db = getDatabase()
  const existing = getCharacter(id)
  if (!existing) return null

  db.prepare(
    `UPDATE characters SET
      name = COALESCE(?, name),
      gender = COALESCE(?, gender),
      age = COALESCE(?, age),
      appearance = COALESCE(?, appearance),
      personality = COALESCE(?, personality),
      extra_prompt = COALESCE(?, extra_prompt),
      is_locked = COALESCE(?, is_locked),
      visual_anchor = COALESCE(?, visual_anchor)
     WHERE id = ?`
  ).run(
    updates.name ?? null,
    updates.gender ?? null,
    updates.age ?? null,
    updates.appearance ?? null,
    updates.personality ?? null,
    updates.extraPrompt ?? null,
    updates.isLocked !== undefined ? (updates.isLocked ? 1 : 0) : null,
    updates.visualAnchor !== undefined ? (updates.visualAnchor ? JSON.stringify(updates.visualAnchor) : null) : null,
    id
  )

  return getCharacter(id)
}

export function deleteCharacter(id: string): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM characters WHERE id = ?').run(id)
  return result.changes > 0
}

function rowToCharacter(row: Record<string, unknown>): Character {
  return {
    id: row.id as string,
    worldId: row.world_id as string,
    name: row.name as string,
    gender: row.gender as string,
    age: row.age as number,
    appearance: row.appearance as string,
    personality: row.personality as string,
    extraPrompt: row.extra_prompt as string,
    isPlayer: (row.is_player as number) === 1,
    isDynamic: (row.is_dynamic as number) === 1,
    isLocked: (row.is_locked as number) === 1,
    visualAnchor: row.visual_anchor ? JSON.parse(row.visual_anchor as string) : null,
    createdAt: row.created_at as string,
  }
}