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
    <div className="h-screen flex flex-col bg-gradient-to-b from-game-bg to-game-panel/30">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">
            ✦
          </div>
          <h1 className="text-xl font-bold">
            <span className="gradient-text">AI Novel Game</span>
          </h1>
        </div>
        <button
          onClick={() => setPage('settings')}
          className="px-4 py-2 text-sm rounded-xl border border-white/[0.10] text-game-muted hover:border-indigo-500/40 hover:text-indigo-300 hover:bg-white/[0.03] transition-all duration-200"
        >
          設定
        </button>
      </header>

      {/* World List */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-game-text">你的世界</h2>
              <p className="text-sm text-game-muted mt-1">選擇一個世界，開始你的冒險</p>
            </div>
            <button
              onClick={() => setPage('world-create')}
              className="btn-primary px-5 py-2.5 rounded-xl font-medium text-sm text-white shadow-lg shadow-indigo-500/25"
            >
              + 建立新世界
            </button>
          </div>

          {worlds.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-6 opacity-30">🌌</div>
              <p className="text-lg text-game-muted mb-2">尚無任何世界</p>
              <p className="text-sm text-game-muted/60">點擊上方按鈕建立你的第一個世界，開始冒險！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {worlds.map((world) => (
                <div
                  key={world.id}
                  className="group flex items-center justify-between p-5 rounded-2xl bg-game-panel/60 border border-white/[0.07] hover:border-indigo-500/30 hover:bg-game-panel/90 transition-all duration-200 cursor-pointer backdrop-blur-sm"
                  onClick={() => handleEnterWorld(world)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 flex items-center justify-center text-xl shrink-0 ring-1 ring-white/[0.07]">
                      🌍
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate text-game-text">{world.name}</h3>
                      <p className="text-sm text-game-muted truncate mt-0.5">
                        {world.config.worldview.slice(0, 80)}{world.config.worldview.length > 80 ? '...' : ''}
                      </p>
                      <p className="text-xs text-game-muted/50 mt-1.5">
                        最後更新: {new Date(world.updatedAt).toLocaleString('zh-TW')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteWorld(world.id, world.name)
                    }}
                    className="ml-4 px-3 py-1.5 text-xs rounded-lg border border-red-400/20 text-red-400/80 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:border-red-400/40 transition-all duration-200"
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
