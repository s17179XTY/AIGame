import React from 'react'
import { useAppStore } from '../stores/appStore'

export default function WorldPreviewPage() {
  const setPage = useAppStore((s) => s.setPage)

  return (
    <div className="h-screen flex flex-col bg-game-bg">
      <header className="flex items-center gap-4 px-8 py-5 border-b border-white/[0.07]">
        <button
          onClick={() => setPage('home')}
          className="flex items-center gap-1.5 text-game-muted hover:text-game-text transition-colors text-sm"
        >
          ← 返回
        </button>
        <h1 className="text-xl font-bold gradient-text">預覽與調整</h1>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6 generating-pulse opacity-40">✨</div>
          <p className="text-lg font-medium text-game-text mb-2">AI 正在生成世界設定...</p>
          <p className="text-sm text-game-muted">此功能將在後續版本中完善</p>
          <button
            onClick={() => setPage('game')}
            className="btn-primary mt-8 px-8 py-3 rounded-xl font-medium text-sm text-white shadow-lg shadow-indigo-500/25"
          >
            略過，直接開始
          </button>
        </div>
      </main>
    </div>
  )
}
