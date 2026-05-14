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

  const typeLabel = (type: string) => {
    switch (type) {
      case 'narration': return '敍述'
      case 'action': return '動作'
      case 'monologue': return '獨白'
      default: return '對話'
    }
  }

  const typeColor = (type: string) => {
    switch (type) {
      case 'narration': return 'bg-slate-500'
      case 'action': return 'bg-indigo-500'
      case 'monologue': return 'bg-purple-500'
      default: return 'bg-emerald-500'
    }
  }

  return (
    <div className="h-screen flex flex-col bg-game-bg">
      <header className="flex items-center gap-4 px-8 py-5 border-b border-white/[0.07]">
        <button
          onClick={() => setPage('game')}
          className="flex items-center gap-1.5 text-game-muted hover:text-game-text transition-colors text-sm"
        >
          ← 返回遊戲
        </button>
        <h1 className="text-xl font-bold gradient-text">
          故事日誌 {world ? `· ${world.name}` : ''}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          {entries.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4 opacity-30">📜</div>
              <p className="text-game-muted">尚無記錄</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/40 via-white/[0.07] to-transparent" />

              <div className="space-y-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex gap-4 pl-14 relative">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-[14px] w-3 h-3 rounded-full ring-2 ring-game-bg ${typeColor(entry.type)} shadow-lg`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-game-text">
                          {entry.speakerName}
                        </span>
                        <span className="text-xs text-game-muted/50">
                          {new Date(entry.createdAt).toLocaleTimeString('zh-TW')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.07] text-game-muted">
                          {typeLabel(entry.type)}
                        </span>
                      </div>
                      <p className="text-sm text-game-text/90 leading-relaxed">{entry.content}</p>
                      {entry.emotion && (
                        <span className="inline-block mt-1.5 text-xs text-game-muted/50">情緒: {entry.emotion}</span>
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
