import React, { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import type { World } from '../../../main/services/types'

export default function HomePage() {
  const [worlds, setWorlds] = useState<World[]>([])
  const setPage = useAppStore((s) => s.setPage)
  const selectWorld = useAppStore((s) => s.selectWorld)

  useEffect(() => {
    window.api.world.list().then(setWorlds)
  }, [])

  const handleEnterWorld = async (world: World) => {
    selectWorld(world.id)
    setPage('game')
  }

  const handleDeleteWorld = async (id: string, name: string) => {
    if (!confirm(`確定要刪除世界「${name}」嗎？此操作無法復原。`)) return
    await window.api.world.delete(id)
    setWorlds((w) => w.filter((x) => x.id !== id))
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-game-accent/30">
        <h1 className="text-2xl font-bold text-game-highlight">AI Novel Game</h1>
        <button
          onClick={() => setPage('settings')}
          className="px-4 py-2 text-sm rounded-lg border border-game-muted/30 text-game-muted hover:border-game-highlight hover:text-game-highlight transition-colors"
        >
          設定
        </button>
      </header>

      {/* World List */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">你的世界</h2>
            <button
              onClick={() => setPage('world-create')}
              className="px-5 py-2.5 bg-game-highlight rounded-lg font-medium hover:bg-game-highlight/80 transition-colors"
            >
              + 建立新世界
            </button>
          </div>

          {worlds.length === 0 ? (
            <div className="text-center py-20 text-game-muted">
              <p className="text-lg mb-4">尚無任何世界</p>
              <p className="text-sm">點擊上方按鈕建立你的第一個世界，開始冒險！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {worlds.map((world) => (
                <div
                  key={world.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-game-panel border border-game-accent/20 hover:border-game-highlight/50 transition-all cursor-pointer group"
                  onClick={() => handleEnterWorld(world)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{world.name}</h3>
                    <p className="text-sm text-game-muted truncate mt-0.5">
                      {world.config.worldview.slice(0, 80)}...
                    </p>
                    <p className="text-xs text-game-muted/60 mt-1">
                      最後更新: {new Date(world.updatedAt).toLocaleString('zh-TW')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteWorld(world.id, world.name)
                    }}
                    className="ml-4 px-3 py-1.5 text-xs rounded-lg border border-red-500/30 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                  >
                    刪除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}