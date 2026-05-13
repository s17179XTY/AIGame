import React, { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { AppSettings, LLMProviderType, ImageProviderType } from '../../../main/services/types'

export default function SettingsPage() {
  const setPage = useAppStore((s) => s.setPage)
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const [form, setForm] = useState<AppSettings>(settings)

  useEffect(() => {
    setForm(settings)
  }, [settings])

  const handleSave = async () => {
    await updateSettings(form)
    setPage('home')
  }

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const inputClass =
    'w-full bg-game-bg border border-game-accent/30 rounded-lg px-3 py-2 text-game-text focus:border-game-highlight outline-none'

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-game-accent/30">
        <button onClick={() => setPage('home')} className="text-game-muted hover:text-game-text">
          &larr; 返回
        </button>
        <h1 className="text-xl font-bold text-game-highlight">設定</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* LLM Settings */}
          <section className="bg-game-panel rounded-xl p-6 border border-game-accent/20">
            <h2 className="text-lg font-semibold mb-4 text-game-highlight">大型語言模型 (LLM)</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-game-muted mb-1">API 格式</label>
                <select
                  value={form.llmProvider}
                  onChange={(e) => update('llmProvider', e.target.value as LLMProviderType)}
                  className={inputClass}
                >
                  <option value="openai">OpenAI 相容</option>
                  <option value="anthropic">Anthropic 相容</option>
                  <option value="gemini">Google Gemini</option>
                </select>
                <p className="text-xs text-game-muted/50 mt-1">
                  選擇 API 格式，OpenAI 相容格式可用於大多數代理/自託管服務
                </p>
              </div>

              <div>
                <label className="block text-sm text-game-muted mb-1">模型名稱</label>
                <input
                  type="text"
                  value={form.llmModel}
                  onChange={(e) => update('llmModel', e.target.value)}
                  placeholder="gpt-4o / claude-sonnet-4-20250514 / gemini-2.5-pro"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-game-muted mb-1">API Key</label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => update('apiKey', e.target.value)}
                  placeholder={form.llmProvider === 'openai' ? 'sk-...' : form.llmProvider === 'anthropic' ? 'sk-ant-...' : 'AIza...'}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-game-muted mb-1">API 地址 (可選)</label>
                <input
                  type="text"
                  value={form.apiBaseUrl}
                  onChange={(e) => update('apiBaseUrl', e.target.value)}
                  placeholder="留空使用官方地址，或填入自訂 API 端點"
                  className={inputClass}
                />
                <p className="text-xs text-game-muted/50 mt-1">
                  例如: https://api.openai.com/v1 或 https://your-proxy.com/v1
                </p>
              </div>
            </div>
          </section>

          {/* Image Settings */}
          <section className="bg-game-panel rounded-xl p-6 border border-game-accent/20">
            <h2 className="text-lg font-semibold mb-4 text-game-highlight">文生圖模型（可選）</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-game-muted mb-1">廠商</label>
                <select
                  value={form.imageProvider}
                  onChange={(e) => update('imageProvider', e.target.value as ImageProviderType | 'none')}
                  className={inputClass}
                >
                  <option value="none">不使用圖片</option>
                  <option value="openai">OpenAI DALL-E</option>
                  <option value="stability">Stability AI</option>
                </select>
              </div>

              {form.imageProvider !== 'none' && (
                <>
                  <div>
                    <label className="block text-sm text-game-muted mb-1">生成頻率</label>
                    <select
                      value={form.imageFrequency}
                      onChange={(e) =>
                        update('imageFrequency', e.target.value as 'conservative' | 'standard' | 'rich')
                      }
                      className={inputClass}
                    >
                      <option value="conservative">保守（僅場景變化）</option>
                      <option value="standard">標準（場景 + 重要行為）</option>
                      <option value="rich">豐富（較多觸發）</option>
                    </select>
                  </div>

                  {form.imageProvider === 'stability' && (
                    <div>
                      <label className="block text-sm text-game-muted mb-1">Stability AI API Key</label>
                      <input
                        type="password"
                        value={form.stabilityApiKey}
                        onChange={(e) => update('stabilityApiKey', e.target.value)}
                        placeholder="sk-..."
                        className={inputClass}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Save */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-game-highlight rounded-lg font-medium hover:bg-game-highlight/80 transition-colors"
            >
              儲存設定
            </button>
            <button
              onClick={() => setPage('home')}
              className="px-6 py-3 border border-game-muted/30 rounded-lg text-game-muted hover:border-game-highlight hover:text-game-text transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}