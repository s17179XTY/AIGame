import React, { useEffect } from 'react'
import { useAppStore } from './stores/appStore'
import { useSettingsStore } from './stores/settingsStore'
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import WorldCreatePage from './pages/WorldCreatePage'
import WorldPreviewPage from './pages/WorldPreviewPage'
import GamePage from './pages/GamePage'
import StoryLogPage from './pages/StoryLogPage'

export default function App() {
  const currentPage = useAppStore((s) => s.currentPage)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const loaded = useSettingsStore((s) => s.loaded)

  useEffect(() => {
    loadSettings()
  }, [])

  if (!loaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-game-bg">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
            <span className="generating-pulse">✦</span>
          </div>
          <p className="text-game-muted text-base">載入中...</p>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />
      case 'settings':
        return <SettingsPage />
      case 'world-create':
        return <WorldCreatePage />
      case 'world-preview':
        return <WorldPreviewPage />
      case 'game':
        return <GamePage />
      case 'story-log':
        return <StoryLogPage />
      default:
        return <HomePage />
    }
  }

  return <div className="h-screen bg-game-bg text-game-text">{renderPage()}</div>
}
