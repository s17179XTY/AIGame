import React, { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import type { StoryEntry, World, Character } from '../../../main/services/types'

export default function StoryLogPage() {
  const setPage = useAppStore((s) => s.setPage)
  const worldId = useAppStore((s) => s.selectedWorldId)

  const [entries, setEntries] = useState<StoryEntry[]>([])
  const [world, setWorld] = useState<World | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])

  useEffect(() => {
    if (!worldId) {
      setPage('home')
      return
    }

    const load = async () => {
      const [log, w, chars] = await Promise.all([
        window.api.story.getLog(worldId),
        window.api.world.get(worldId),
        window.api.character.list(worldId),
      ])
      setEntries(log)
      setWorld(w)
      setCharacters(chars)
    }
    load()
  }, [worldId])

  const getCharacterName = (speakerId: string | null) => {
    if (!speakerId) return '旁白'
    return characters.find((c) => c.id === speakerId)?.name ?? '未知'
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-game-accent/30">
        <button onClick={() => setPage('game')} className="text-game-muted hover:text-game-text">
          ← 返回遊戲
        </button>
        <h1 className="text-xl font-bold text-game-highlight">
          故事日誌 {world ? `· ${world.name}` : ''}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {entries.length === 0 ? (
            <div className="text-center text-game-muted py-20">尚無記錄</div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-game-accent/30" />

              <div className="space-y-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex gap-4 pl-10 relative">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-[11px] w-2.5 h-2.5 rounded-full border-2 border-game-bg ${
                        entry.type === 'narration'
                          ? 'bg-game-muted'
                          : entry.type === 'action'
                          ? 'bg-game-highlight'
                          : 'bg-game-accent'
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-game-highlight">
                          {entry.speakerName}
                        </span>
                        <span className="text-xs text-game-muted/60">
                          {new Date(entry.createdAt).toLocaleTimeString('zh-TW')}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-game-accent/30 text-game-muted">
                          {entry.type === 'narration' ? '敘述' : entry.type === 'action' ? '動作' : entry.type === 'monologue' ? '獨白' : '對話'}
                        </span>
                      </div>
                      <p className="text-sm text-game-text/90 leading-relaxed">{entry.content}</p>
                      {entry.emotion && (
                        <span className="text-xs text-game-muted/60">情緒: {entry.emotion}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}