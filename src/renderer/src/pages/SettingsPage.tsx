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
    'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-game-text placeholder-game-muted/40 focus:border-indigo-400/50 focus:bg-white/[0.06] outline-none transition-all duration-200'
  const selectClass =
    'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-game-text focus:border-indigo-400/50 focus:bg-white/[0.06] outline-none transition-all duration-200 appearance-none cursor-pointer'

  return (
    <div className="h-screen flex flex-col bg-game-bg">
      <header className="flex items-center gap-4 px-8 py-5 border-b border-white/[0.06]">
        <button
          onClick={() => setPage('home')}
          className="flex items-center gap-1.5 text-game-muted hover:text-game-text transition-colors text-sm"
        >
          ← 返回
        </button>
        <h1 className="text-xl font-bold gradient-text">設定</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* LLM Settings */}
          <section className="rounded-2xl bg-game-panel/60 border border-white/[0.06] p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">🧠</span>
              <h2 className="text-lg font-semibold text-game-text">大型語言模型 (LLM)</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-game-muted mb-2">提供商</label>
                <select
                  value={form.llmProvider}
                  onChange={(e) => update('llmProvider', e.target.value as LLMProviderType)}
                  className={selectClass}
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-game-muted mb-2">模型</label>
                <input
                  type="text"
                  value={form.llmModel}
                  onChange={(e) => update('llmModel', e.target.value)}
                  placeholder="gpt-4o"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-game-muted mb-2">OpenAI API Key</label>
                <input
                  type="password"
                  value={form.openaiApiKey}
                  onChange={(e) => update('openaiApiKey', e.target.value)}
                  placeholder="sk-..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-game-muted mb-2">Anthropic API Key</label>
                <input
                  type="password"
                  value={form.anthropicApiKey}
                  onChange={(e) => update('anthropicApiKey', e.target.value)}
                  placeholder="sk-ant-..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-game-muted mb-2">Gemini API Key</label>
                <input
                  type="password"
                  value={form.geminiApiKey}
                  onChange={(e) => update('geminiApiKey', e.target.value)}
                  placeholder="AIza..."
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Image Settings */}
          <section className="rounded-2xl bg-game-panel/60 border border-white/[0.06] p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">🎨</span>
              <h2 className="text-lg font-semibold text-game-text">文生圖模型（可選）</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-game-muted mb-2">提供商</label>
                <select
                  value={form.imageProvider}
                  onChange={(e) => update('imageProvider', e.target.value as ImageProviderType | 'none')}
                  className={selectClass}
                >
                  <option value="none">不使用圖片</option>
                  <option value="openai">OpenAI DALL-E</option>
                  <option value="stability">Stability AI</option>
                </select>
              </div>

              {form.imageProvider !== 'none' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-game-muted mb-2">生成頻率</label>
                    <select
                      value={form.imageFrequency}
                      onChange={(e) =>
                        update('imageFrequency', e.target.value as 'conservative' | 'standard' | 'rich')
                      }
                      className={selectClass}
                    >
                      <option value="conservative">保守（僅場景變化）</option>
                      <option value="standard">標準（場景 + 重要行動）</option>
                      <option value="rich">豐富（較多觸發）</option>
                    </select>
                  </div>

                  {form.imageProvider === 'stability' && (
                    <div>
                      <label className="block text-sm font-medium text-game-muted mb-2">Stability AI API Key</label>
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
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 btn-primary py-3 rounded-xl font-medium text-sm text-white shadow-lg shadow-indigo-500/20"
            >
              儲存設定
            </button>
            <button
              onClick={() => setPage('home')}
              className="px-8 py-3 rounded-xl border border-white/[0.08] text-game-muted hover:border-indigo-400/40 hover:text-indigo-300 hover:bg-white/[0.03] transition-all duration-200"
            >
              取消
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
