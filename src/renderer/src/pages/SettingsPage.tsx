import React, { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { AppSettings, LLMConfig, LLMProviderType, ImageProviderType } from '../../../main/services/types'

const DEFAULT_LLM_CONFIG_INPUT = {
  name: '',
  provider: 'openai' as LLMProviderType,
  model: '',
  apiKey: '',
  apiBaseUrl: '',
  temperature: 0.8,
  maxTokens: 4096,
  topP: 1.0,
  frequencyPenalty: 0,
  presencePenalty: 0,
}

export default function SettingsPage() {
  const setPage = useAppStore((s) => s.setPage)
  const settings = useSettingsStore((s) => s.settings)
  const configs = useSettingsStore((s) => s.configs)
  const activeConfigId = useSettingsStore((s) => s.activeConfigId)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const loadConfigs = useSettingsStore((s) => s.loadConfigs)
  const createConfig = useSettingsStore((s) => s.createConfig)
  const updateConfig = useSettingsStore((s) => s.updateConfig)
  const deleteConfig = useSettingsStore((s) => s.deleteConfig)
  const setActiveConfig = useSettingsStore((s) => s.setActiveConfig)
  const pingConfig = useSettingsStore((s) => s.pingConfig)

  const [form, setForm] = useState<AppSettings>(settings)
  const [showModal, setShowModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState<LLMConfig | null>(null)
  const [configForm, setConfigForm] = useState({ ...DEFAULT_LLM_CONFIG_INPUT })
  const [pingResults, setPingResults] = useState<Record<string, { ok: boolean; latencyMs: number } | null>>({})
  const [pinging, setPinging] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setForm(settings)
  }, [settings])

  useEffect(() => {
    loadConfigs()
  }, [])

  const handleSave = async () => {
    await updateSettings(form)
    setPage('home')
  }

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const openAddModal = () => {
    setEditingConfig(null)
    setConfigForm({ ...DEFAULT_LLM_CONFIG_INPUT })
    setShowModal(true)
  }

  const openEditModal = (config: LLMConfig) => {
    setEditingConfig(config)
    setConfigForm({
      name: config.name,
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      apiBaseUrl: config.apiBaseUrl,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
    })
    setShowModal(true)
  }

  const handleConfigSave = async () => {
    if (!configForm.name.trim()) return
    if (editingConfig) {
      await updateConfig(editingConfig.id, configForm)
    } else {
      await createConfig(configForm)
    }
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    await deleteConfig(id)
  }

  const handleSetActive = async (id: string) => {
    await setActiveConfig(id)
  }

  const handlePing = async (config: LLMConfig) => {
    setPinging((p) => ({ ...p, [config.id]: true }))
    setPingResults((p) => ({ ...p, [config.id]: null }))
    try {
      const result = await pingConfig(config)
      setPingResults((p) => ({ ...p, [config.id]: result }))
    } catch {
      setPingResults((p) => ({ ...p, [config.id]: { ok: false, latencyMs: 0 } }))
    } finally {
      setPinging((p) => ({ ...p, [config.id]: false }))
    }
  }

  const updateCfg = <K extends keyof typeof configForm>(key: K, value: (typeof configForm)[K]) => {
    setConfigForm((f) => ({ ...f, [key]: value }))
  }

  const inputClass =
    'w-full bg-game-bg border border-game-accent/30 rounded-lg px-3 py-2 text-game-text focus:border-game-highlight outline-none'

  const providerLabel = (p: LLMProviderType) =>
    p === 'openai' ? 'OpenAI' : p === 'anthropic' ? 'Anthropic' : 'Gemini'

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
          {/* LLM Configurations */}
          <section className="bg-game-panel rounded-xl p-6 border border-game-accent/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-game-highlight">LLM Configurations</h2>
              <button
                onClick={openAddModal}
                className="px-3 py-1.5 text-sm border border-game-highlight/50 text-game-highlight rounded-lg hover:bg-game-highlight/10 transition-colors"
              >
                + Add Configuration
              </button>
            </div>

            {configs.length === 0 ? (
              <p className="text-game-muted text-sm py-8 text-center">
                No configurations yet. Click "Add Configuration" to create one.
              </p>
            ) : (
              <div className="space-y-3">
                {configs.map((cfg) => {
                  const isActive = cfg.id === activeConfigId
                  const ping = pingResults[cfg.id]
                  return (
                    <div
                      key={cfg.id}
                      className={`bg-game-bg rounded-lg p-4 border transition-colors ${
                        isActive
                          ? 'border-game-highlight shadow-sm shadow-game-highlight/10'
                          : 'border-game-accent/20 hover:border-game-accent/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-game-text truncate">{cfg.name}</h3>
                            <span className="text-xs px-2 py-0.5 rounded bg-game-accent/20 text-game-muted">
                              {providerLabel(cfg.provider)}
                            </span>
                            {isActive && (
                              <span className="text-xs px-2 py-0.5 rounded bg-game-highlight/20 text-game-highlight">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-game-muted truncate">{cfg.model}</p>
                          {cfg.apiBaseUrl && (
                            <p className="text-xs text-game-muted/50 truncate mt-0.5">{cfg.apiBaseUrl}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                          <button
                            onClick={() => handlePing(cfg)}
                            disabled={pinging[cfg.id]}
                            className="px-2 py-1 text-xs border border-game-accent/30 rounded text-game-muted hover:border-game-highlight hover:text-game-highlight transition-colors disabled:opacity-50"
                          >
                            {pinging[cfg.id] ? '...' : ping ? (ping.ok ? `${ping.latencyMs}ms` : 'fail') : 'Ping'}
                          </button>
                          <button
                            onClick={() => openEditModal(cfg)}
                            className="px-2 py-1 text-xs border border-game-accent/30 rounded text-game-muted hover:border-game-highlight hover:text-game-highlight transition-colors"
                          >
                            Edit
                          </button>
                          {!isActive && (
                            <button
                              onClick={() => handleSetActive(cfg.id)}
                              className="px-2 py-1 text-xs border border-game-highlight/50 rounded text-game-highlight hover:bg-game-highlight/10 transition-colors"
                            >
                              Set Active
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(cfg.id)}
                            className="px-2 py-1 text-xs border border-red-500/30 rounded text-red-400 hover:border-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            Del
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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

      {/* Add/Edit Config Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-game-panel border border-game-accent/30 rounded-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-game-highlight">
                  {editingConfig ? 'Edit Configuration' : 'New Configuration'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-game-muted hover:text-game-text text-xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-game-muted mb-1">Name</label>
                  <input
                    type="text"
                    value={configForm.name}
                    onChange={(e) => updateCfg('name', e.target.value)}
                    placeholder="e.g. LM Studio Local, OpenAI Cloud"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm text-game-muted mb-1">Provider</label>
                  <select
                    value={configForm.provider}
                    onChange={(e) => updateCfg('provider', e.target.value as LLMProviderType)}
                    className={inputClass}
                  >
                    <option value="openai">OpenAI Compatible</option>
                    <option value="anthropic">Anthropic Compatible</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-game-muted mb-1">Model Name</label>
                  <input
                    type="text"
                    value={configForm.model}
                    onChange={(e) => updateCfg('model', e.target.value)}
                    placeholder="gpt-4o / claude-sonnet-4-20250514 / gemini-2.5-pro"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm text-game-muted mb-1">API Key</label>
                  <input
                    type="password"
                    value={configForm.apiKey}
                    onChange={(e) => updateCfg('apiKey', e.target.value)}
                    placeholder="sk-..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm text-game-muted mb-1">API Base URL (Optional)</label>
                  <input
                    type="text"
                    value={configForm.apiBaseUrl}
                    onChange={(e) => updateCfg('apiBaseUrl', e.target.value)}
                    placeholder="Leave empty for official URL"
                    className={inputClass}
                  />
                </div>

                <div className="pt-3 border-t border-game-accent/20">
                  <h4 className="text-sm font-semibold text-game-highlight mb-3">Model Parameters</h4>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm text-game-muted">Temperature</label>
                        <span className="text-xs text-game-highlight font-mono bg-game-bg px-2 py-0.5 rounded">
                          {configForm.temperature.toFixed(1)}
                        </span>
                      </div>
                      <input type="range" min="0" max="2" step="0.1"
                        value={configForm.temperature}
                        onChange={(e) => updateCfg('temperature', parseFloat(e.target.value))}
                        className="w-full h-2 bg-game-accent/20 rounded-lg appearance-none cursor-pointer accent-game-highlight"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm text-game-muted">Top P</label>
                        <span className="text-xs text-game-highlight font-mono bg-game-bg px-2 py-0.5 rounded">
                          {configForm.topP.toFixed(2)}
                        </span>
                      </div>
                      <input type="range" min="0" max="1" step="0.05"
                        value={configForm.topP}
                        onChange={(e) => updateCfg('topP', parseFloat(e.target.value))}
                        className="w-full h-2 bg-game-accent/20 rounded-lg appearance-none cursor-pointer accent-game-highlight"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-game-muted mb-1">Max Output Tokens</label>
                      <input type="number" min="1" max="131072"
                        value={configForm.maxTokens}
                        onChange={(e) => updateCfg('maxTokens', parseInt(e.target.value) || 4096)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm text-game-muted">Frequency Penalty</label>
                        <span className="text-xs text-game-highlight font-mono bg-game-bg px-2 py-0.5 rounded">
                          {configForm.frequencyPenalty.toFixed(1)}
                        </span>
                      </div>
                      <input type="range" min="-2" max="2" step="0.1"
                        value={configForm.frequencyPenalty}
                        onChange={(e) => updateCfg('frequencyPenalty', parseFloat(e.target.value))}
                        className="w-full h-2 bg-game-accent/20 rounded-lg appearance-none cursor-pointer accent-game-highlight"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm text-game-muted">Presence Penalty</label>
                        <span className="text-xs text-game-highlight font-mono bg-game-bg px-2 py-0.5 rounded">
                          {configForm.presencePenalty.toFixed(1)}
                        </span>
                      </div>
                      <input type="range" min="-2" max="2" step="0.1"
                        value={configForm.presencePenalty}
                        onChange={(e) => updateCfg('presencePenalty', parseFloat(e.target.value))}
                        className="w-full h-2 bg-game-accent/20 rounded-lg appearance-none cursor-pointer accent-game-highlight"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-game-accent/20">
                  <button
                    onClick={handleConfigSave}
                    disabled={!configForm.name.trim()}
                    className="flex-1 py-2 bg-game-highlight rounded-lg font-medium hover:bg-game-highlight/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-game-muted/30 rounded-lg text-game-muted hover:border-game-highlight hover:text-game-text transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}