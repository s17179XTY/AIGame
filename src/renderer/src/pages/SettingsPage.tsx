import React, { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { AppSettings, LLMProviderType, ImageProviderType } from '../../../main/services/types'

export default function SettingsPage() {
  const setPage = useAppStore((s) => s.setPage)
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const [form, setForm] = useState<AppSettings>(settings)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

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

  const handleTestConnection = async () => {
    if (!form.apiKey) {
      setTestResult({ success: false, message: 'Please enter API Key first' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const provider = await window.api.settings.testLLM(
        form.llmProvider,
        form.apiKey,
        form.llmModel,
        form.apiBaseUrl || undefined
      )
      setTestResult(provider)
    } catch (err: any) {
      setTestResult({ success: false, message: 'Test failed: ' + (err.message ?? 'Unknown error') })
    } finally {
      setTesting(false)
    }
  }

  const inputClass =
    'w-full bg-game-bg border border-game-accent/30 rounded-lg px-3 py-2 text-game-text focus:border-game-highlight outline-none'

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-game-accent/30">
        <button onClick={() => setPage('home')} className="text-game-muted hover:text-game-text">
          &larr; Back
        </button>
        <h1 className="text-xl font-bold text-game-highlight">Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* LLM Settings */}
          <section className="bg-game-panel rounded-xl p-6 border border-game-accent/20">
            <h2 className="text-lg font-semibold mb-4 text-game-highlight">LLM Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-game-muted mb-1">Provider</label>
                <select
                  value={form.llmProvider}
                  onChange={(e) => update('llmProvider', e.target.value as LLMProviderType)}
                  className={inputClass}
                >
                  <option value="openai">OpenAI Compatible</option>
                  <option value="anthropic">Anthropic Compatible</option>
                  <option value="gemini">Google Gemini</option>
                </select>
                <p className="text-xs text-game-muted/50 mt-1">
                  OpenAI-compatible format works with most proxy/self-hosted services
                </p>
              </div>

              <div>
                <label className="block text-sm text-game-muted mb-1">Model Name</label>
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
                  placeholder="sk-..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-game-muted mb-1">API Base URL (Optional)</label>
                <input
                  type="text"
                  value={form.apiBaseUrl}
                  onChange={(e) => update('apiBaseUrl', e.target.value)}
                  placeholder="Leave empty for official URL, or enter custom endpoint"
                  className={inputClass}
                />
                <p className="text-xs text-game-muted/50 mt-1">
                  e.g. https://api.openai.com/v1 or https://your-proxy.com/v1
                </p>
              </div>

              <div className="pt-2 border-t border-game-accent/20">
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-4 py-2 text-sm border border-game-highlight/50 text-game-highlight rounded-lg hover:bg-game-highlight/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
                {testResult && (
                  <p className={`mt-2 text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult.success ? 'OK: ' : 'FAIL: '}
                    {testResult.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Image Settings */}
          <section className="bg-game-panel rounded-xl p-6 border border-game-accent/20">
            <h2 className="text-lg font-semibold mb-4 text-game-highlight">Image Generation (Optional)</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-game-muted mb-1">Provider</label>
                <select
                  value={form.imageProvider}
                  onChange={(e) => update('imageProvider', e.target.value as ImageProviderType | 'none')}
                  className={inputClass}
                >
                  <option value="none">None</option>
                  <option value="openai">OpenAI DALL-E</option>
                  <option value="stability">Stability AI</option>
                </select>
              </div>

              {form.imageProvider !== 'none' && (
                <>
                  <div>
                    <label className="block text-sm text-game-muted mb-1">Frequency</label>
                    <select
                      value={form.imageFrequency}
                      onChange={(e) =>
                        update('imageFrequency', e.target.value as 'conservative' | 'standard' | 'rich')
                      }
                      className={inputClass}
                    >
                      <option value="conservative">Conservative (scene changes only)</option>
                      <option value="standard">Standard (scene + major actions)</option>
                      <option value="rich">Rich (more triggers)</option>
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

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-game-highlight rounded-lg font-medium hover:bg-game-highlight/80 transition-colors"
            >
              Save Settings
            </button>
            <button
              onClick={() => setPage('home')}
              className="px-6 py-3 border border-game-muted/30 rounded-lg text-game-muted hover:border-game-highlight hover:text-game-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}