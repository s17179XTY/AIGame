import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'aigame.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  initializeSchema(db)
  return db
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS worlds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      config TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT '',
      age INTEGER NOT NULL DEFAULT 0,
      appearance TEXT NOT NULL DEFAULT '',
      personality TEXT NOT NULL DEFAULT '',
      extra_prompt TEXT NOT NULL DEFAULT '',
      is_player INTEGER NOT NULL DEFAULT 0,
      is_dynamic INTEGER NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 0,
      visual_anchor TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS world_state (
      id TEXT PRIMARY KEY,
      world_id TEXT UNIQUE NOT NULL,
      scene TEXT NOT NULL DEFAULT '',
      time TEXT NOT NULL DEFAULT '',
      weather TEXT NOT NULL DEFAULT '',
      character_emotions TEXT NOT NULL DEFAULT '{}',
      relationships TEXT NOT NULL DEFAULT '[]',
      recent_events TEXT NOT NULL DEFAULT '[]',
      last_image_context TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS story_log (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      speaker_id TEXT,
      speaker_name TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'narration',
      emotion TEXT NOT NULL DEFAULT '',
      image_trigger_context TEXT,
      image_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY (speaker_id) REFERENCES characters(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS llm_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'openai',
      model TEXT NOT NULL DEFAULT 'gpt-4o',
      api_key TEXT NOT NULL DEFAULT '',
      api_base_url TEXT NOT NULL DEFAULT '',
      temperature REAL NOT NULL DEFAULT 0.8,
      max_tokens INTEGER NOT NULL DEFAULT 4096,
      top_p REAL NOT NULL DEFAULT 1.0,
      frequency_penalty REAL NOT NULL DEFAULT 0,
      presence_penalty REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

        CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_characters_world ON characters(world_id);
    CREATE INDEX IF NOT EXISTS idx_story_log_world ON story_log(world_id);
    CREATE INDEX IF NOT EXISTS idx_story_log_sequence ON story_log(world_id, sequence);
  `)
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}