import React, { Component, useEffect } from 'react'
import { useAppStore } from './stores/appStore'
import { useSettingsStore } from './stores/settingsStore'
import { I18nProvider } from './i18n'
import { ToastProvider } from './components/ToastProvider'
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import WorldCreatePage from './pages/WorldCreatePage'
import WorldPreviewPage from './pages/WorldPreviewPage'
import GamePage from './pages/GamePage'
import StoryLogPage from './pages/StoryLogPage'


class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error.message, info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-game-bg">
          <div className="text-center max-w-md px-8">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold text-red-400 mb-2">画面渲染錯誤</h2>
            <p className="text-sm text-game-muted mb-4 break-all">{this.state.error?.message || "Unknown error"}</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              className="px-4 py-2 bg-game-highlight rounded-lg text-sm font-medium">重新載入</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const currentPage = useAppStore((s) => s.currentPage)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const loaded = useSettingsStore((s) => s.loaded)
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  useEffect(() => {
    loadSettings()
  }, [])

  if (!loaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-game-bg">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
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

  return (
    <I18nProvider
      initialLang={settings.language || 'zh-TW'}
      onLangChange={(lang) => updateSettings({ language: lang })}
    >
      <ToastProvider>
        <ErrorBoundary key={currentPage}><div className="h-screen bg-game-bg text-game-text">{renderPage()}</div></ErrorBoundary>
      </ToastProvider>
    </I18nProvider>
  )
}