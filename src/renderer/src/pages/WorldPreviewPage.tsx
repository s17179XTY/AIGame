import React from 'react'
import { useAppStore } from '../stores/appStore'

export default function WorldPreviewPage() {
  const setPage = useAppStore((s) => s.setPage)

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-game-accent/30">
        <button onClick={() => setPage('home')} className="text-game-muted hover:text-game-text">
          ← 返回
        </button>
        <h1 className="text-xl font-bold text-game-highlight">預覽與調整</h1>
      </header>

      <main className="flex-1 flex items-center justify-center text-game-muted">
        <div className="text-center">
          <p className="text-lg mb-2">AI 正在生成世界設定...</p>
          <p className="text-sm">此功能將在後續版本中完善</p>
          <button
            onClick={() => setPage('game')}
            className="mt-6 px-6 py-2 bg-game-highlight rounded-lg hover:bg-game-highlight/80 transition-colors"
          >
            略過，直接開始
          </button>
        </div>
      </main>
    </div>
  )
}