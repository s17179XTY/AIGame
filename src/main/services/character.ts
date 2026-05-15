import { randomUUID } from 'crypto'
import { getDatabase } from '../database'
import { Character, CharacterConfig, VisualAnchor } from './types'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export function createCharacter(
  worldId: string,
  config: CharacterConfig,
  isPlayer: boolean = false,
  isDynamic: boolean = false
): Character {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO characters (id, world_id, name, nickname, gender, age, appearance, personality, extra_prompt, is_player, is_dynamic, is_locked, visual_anchor, image_path, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    worldId,
    config.name,
    config.nickname || '',
    config.gender,
    config.age,
    config.appearance,
    config.personality,
    config.extraPrompt,
    isPlayer ? 1 : 0,
    isDynamic ? 1 : 0,
    0,
    null,
    config.imagePath || null,
    now
  )

  return {
    id,
    worldId,
    name: config.name,
    nickname: config.nickname,
    gender: config.gender,
    age: config.age,
    appearance: config.appearance,
    personality: config.personality,
    extraPrompt: config.extraPrompt,
    imagePath: config.imagePath,
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

export function listGlobalCharacters(): Character[] {
  const db = getDatabase()
  const rows = db.prepare("SELECT * FROM characters WHERE world_id = '__global__' ORDER BY created_at ASC").all() as Record<string, unknown>[]
  return rows.map(rowToCharacter)
}

export function assignCharacterToWorld(characterId: string, worldId: string): Character | null {
  const existing = getCharacter(characterId)
  if (!existing) return null
  if (existing.worldId !== '__global__') return null

  // Copy instead of move: create new character in target world
  const newId = randomUUID()
  const now = new Date().toISOString()
  const db = getDatabase()
  
  db.prepare(
    `INSERT INTO characters (id, world_id, name, nickname, gender, age, appearance, personality, extra_prompt, is_player, is_dynamic, is_locked, visual_anchor, image_path, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?)`
  ).run(
    newId, worldId, existing.name, existing.nickname || '', existing.gender, existing.age,
    existing.appearance, existing.personality, existing.extraPrompt,
    existing.visualAnchor ? JSON.stringify(existing.visualAnchor) : null,
    existing.imagePath || null, now
  )
  
  return getCharacter(newId)
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
      nickname = COALESCE(?, nickname),
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
    updates.nickname ?? null,
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


export function uploadCharacterImage(characterId: string, sourcePath: string): Character | null {
  const char = getCharacter(characterId)
  if (!char) return null

  const charDir = path.join(app.getPath('userData'), 'characters')
  if (!fs.existsSync(charDir)) {
    fs.mkdirSync(charDir, { recursive: true })
  }

  const ext = path.extname(sourcePath) || '.png'
  const destPath = path.join(charDir, characterId + '_' + Date.now() + ext)
  fs.copyFileSync(sourcePath, destPath)

  const db = getDatabase()
  db.prepare('UPDATE characters SET image_path = ? WHERE id = ?').run(destPath, characterId)

  return getCharacter(characterId)
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
    nickname: row.nickname as string || undefined,
    gender: row.gender as string,
    age: row.age as number,
    appearance: row.appearance as string,
    personality: row.personality as string,
    extraPrompt: row.extra_prompt as string,
    isPlayer: (row.is_player as number) === 1,
    isDynamic: (row.is_dynamic as number) === 1,
    isLocked: (row.is_locked as number) === 1,
    visualAnchor: row.visual_anchor ? JSON.parse(row.visual_anchor as string) : null,
    imagePath: (row.image_path as string) || undefined,
    createdAt: row.created_at as string,
  }
}