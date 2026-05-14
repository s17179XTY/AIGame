import React, { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useI18n } from '../i18n'
import { useToast } from '../components/ToastProvider'
import type { AppSettings, LLMConfig, ImageConfig, VoiceConfig, LLMProviderType, ImageProviderType, VoiceProviderType } from '../../../main/services/types'

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

const DEFAULT_IMAGE_CONFIG_INPUT = {
  name: '',
  provider: 'openai' as ImageProviderType,
  model: '',
  apiKey: '',
  apiBaseUrl: '',
  size: '1024x1024',
  quality: 'standard',
}

const DEFAULT_VOICE_CONFIG_INPUT = {
  name: '',
  provider: 'openai' as VoiceProviderType,
  model: '',
  apiKey: '',
  voice: 'alloy',
  speed: 1.0,
}

export default function SettingsPage() {
  const { t } = useI18n()
  const toast = useToast()
  const setPage = useAppStore((s) => s.setPage)
  const settings = useSettingsStore((s) => s.settings)
  const configs = useSettingsStore((s) => s.configs)
  const imageConfigs = useSettingsStore((s) => s.imageConfigs)
  const voiceConfigs = useSettingsStore((s) => s.voiceConfigs)
  const activeConfigId = useSettingsStore((s) => s.activeConfigId)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const loadConfigs = useSettingsStore((s) => s.loadConfigs)

  const createConfig = useSettingsStore((s) => s.createConfig)
  const updateConfig = useSettingsStore((s) => s.updateConfig)
  const deleteConfig = useSettingsStore((s) => s.deleteConfig)
  const setActiveConfig = useSettingsStore((s) => s.setActiveConfig)
  const pingConfig = useSettingsStore((s) => s.pingConfig)

  const loadImageConfigs = useSettingsStore((s) => s.loadImageConfigs)
  const createImageConfig = useSettingsStore((s) => s.createImageConfig)
  const updateImageConfig = useSettingsStore((s) => s.updateImageConfig)
  const deleteImageConfig = useSettingsStore((s) => s.deleteImageConfig)
  const setActiveImageConfig = useSettingsStore((s) => s.setActiveImageConfig)
  const pingImageConfig = useSettingsStore((s) => s.pingImageConfig)

  const loadVoiceConfigs = useSettingsStore((s) => s.loadVoiceConfigs)
  const createVoiceConfig = useSettingsStore((s) => s.createVoiceConfig)
  const updateVoiceConfig = useSettingsStore((s) => s.updateVoiceConfig)
  const deleteVoiceConfig = useSettingsStore((s) => s.deleteVoiceConfig)
  const setActiveVoiceConfig = useSettingsStore((s) => s.setActiveVoiceConfig)
  const pingVoiceConfig = useSettingsStore((s) => s.pingVoiceConfig)

  const [form, setForm] = useState<AppSettings>(settings)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'llm' | 'image' | 'voice'>('llm')
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null)
  const [llmForm, setLlmForm] = useState({ ...DEFAULT_LLM_CONFIG_INPUT })
  const [imageForm, setImageForm] = useState({ ...DEFAULT_IMAGE_CONFIG_INPUT })
  const [voiceForm, setVoiceForm] = useState({ ...DEFAULT_VOICE_CONFIG_INPUT })
  const [pingResults, setPingResults] = useState<Record<string, { ok: boolean; latencyMs: number } | null>>({})
  const [pinging, setPinging] = useState<Record<string, boolean>>({})

  useEffect(() => { setForm(settings) }, [settings])
  useEffect(() => { loadConfigs(); loadImageConfigs(); loadVoiceConfigs() }, [])

  const handleSave = async () => {
    await updateSettings(form)
    setPage('home')
  }

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const openAddModal = (type: 'llm' | 'image' | 'voice') => {
    setModalType(type)
    setEditingConfigId(null)
    if (type === 'llm') setLlmForm({ ...DEFAULT_LLM_CONFIG_INPUT })
    if (type === 'image') setImageForm({ ...DEFAULT_IMAGE_CONFIG_INPUT })
    if (type === 'voice') setVoiceForm({ ...DEFAULT_VOICE_CONFIG_INPUT })
    setShowModal(true)
  }

  const openEditModal = (type: 'llm' | 'image' | 'voice', config: any) => {
    setModalType(type)
    setEditingConfigId(config.id)
    if (type === 'llm') setLlmForm({ name: config.name, provider: config.provider, model: config.model, apiKey: config.apiKey, apiBaseUrl: config.apiBaseUrl, temperature: config.temperature, maxTokens: config.maxTokens, topP: config.topP, frequencyPenalty: config.frequencyPenalty, presencePenalty: config.presencePenalty })
    if (type === 'image') setImageForm({ name: config.name, provider: config.provider, model: config.model, apiKey: config.apiKey, apiBaseUrl: config.apiBaseUrl, size: config.size, quality: config.quality })
    if (type === 'voice') setVoiceForm({ name: config.name, provider: config.provider, model: config.model, apiKey: config.apiKey, voice: config.voice, speed: config.speed })
    setShowModal(true)
  }

  const handleModalSave = async () => {
    if (modalType === 'llm') {
      if (!llmForm.name.trim()) return
      if (editingConfigId) await updateConfig(editingConfigId, llmForm)
      else await createConfig(llmForm)
    }
    if (modalType === 'image') {
      if (!imageForm.name.trim()) return
      if (editingConfigId) await updateImageConfig(editingConfigId, imageForm)
      else await createImageConfig(imageForm)
    }
    if (modalType === 'voice') {
      if (!voiceForm.name.trim()) return
      if (editingConfigId) await updateVoiceConfig(editingConfigId, voiceForm)
      else await createVoiceConfig(voiceForm)
    }
    setShowModal(false)
  }

  const handleDelete = async (type: 'llm' | 'image' | 'voice', id: string) => {
    if (type === 'llm') await deleteConfig(id)
    if (type === 'image') await deleteImageConfig(id)
    if (type === 'voice') await deleteVoiceConfig(id)
  }

  const handleSetActive = async (type: 'llm' | 'image' | 'voice', id: string) => {
    if (type === 'llm') await setActiveConfig(id)
    if (type === 'image') await setActiveImageConfig(id)
    if (type === 'voice') await setActiveVoiceConfig(id)
  }

  const handlePing = async (type: 'llm' | 'image' | 'voice', config: any) => {
    setPinging((p) => ({ ...p, [config.id]: true }))
    setPingResults((p) => ({ ...p, [config.id]: null }))
    try {
      let result: { ok: boolean; latencyMs: number }
      if (type === 'llm') result = await pingConfig(config)
      else if (type === 'image') result = await pingImageConfig(config)
      else result = await pingVoiceConfig(config)
      setPingResults((p) => ({ ...p, [config.id]: result }))
      if (result.ok) toast.show(t('settings.testSuccess') + ' (' + result.latencyMs + 'ms)')
      else toast.show(t('settings.testFail'))
    } catch {
      setPingResults((p) => ({ ...p, [config.id]: { ok: false, latencyMs: 0 } }))
    } finally {
      setPinging((p) => ({ ...p, [config.id]: false }))
    }
  }

  const inputClass = 'w-full bg-game-bg border border-game-accent/30 rounded-lg px-3 py-2 text-game-text focus:border-game-highlight outline-none'

  const providerLabel = (p: string) =>
    p === 'openai' ? 'OpenAI' : p === 'anthropic' ? 'Anthropic' : p === 'gemini' ? 'Gemini' : p === 'stability' ? 'Stability' : p

  const renderConfigCards = (
    title: string,
    icon: string,
    items: any[],
    type: 'llm' | 'image' | 'voice',
    activeId: string | null,
    getSubtitle: (item: any) => string
  ) => (
    <section className="bg-game-panel rounded-xl p-6 border border-game-accent/20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-game-highlight">{icon} {title}</h2>
        <button onClick={() => openAddModal(type)}
          className="px-3 py-1.5 text-sm border border-game-highlight/50 text-game-highlight rounded-lg hover:bg-game-highlight/10 transition-colors">
          {t('settings.add')}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-game-muted py-4">{t('settings.noConfigs')}</p>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const isActive = item.id === activeId
            const result = pingResults[item.id]
            const isPinging = pinging[item.id]
            return (
              <div key={item.id}
                className={'p-4 rounded-lg border transition-colors ' + (isActive ? 'border-game-highlight bg-game-highlight/5' : 'border-game-accent/20 bg-game-bg/30 hover:border-game-accent/40')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={'text-xs font-mono px-2 py-0.5 rounded ' + (item.provider === 'openai' ? 'bg-green-500/20 text-green-400' : item.provider === 'anthropic' ? 'bg-orange-500/20 text-orange-400' : item.provider === 'gemini' ? 'bg-blue-500/20 text-blue-400' : item.provider === 'stability' ? 'bg-purple-500/20 text-purple-400' : 'bg-game-accent/30 text-game-muted')}>
                      {providerLabel(item.provider)}
                    </span>
                    <div className="min-w-0">
                      <span className="font-medium text-game-text truncate block">{isActive ? '\u2B50 ' : ''}{item.name}</span>
                      <span className="text-xs text-game-muted truncate block">{getSubtitle(item)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handlePing(type, item)} disabled={isPinging}
                      className={'px-2 py-1 text-xs border rounded transition-colors ' + (result?.ok ? 'border-green-500/30 text-green-400' : result && !result.ok ? 'border-red-500/30 text-red-400' : 'border-game-muted/30 text-game-muted hover:border-game-highlight')}>
                      {isPinging ? '...' : result ? (result.ok ? result.latencyMs + 'ms' : 'FAIL') : t('settings.ping')}
                    </button>
                    {!isActive && (
                      <button onClick={() => handleSetActive(type, item.id)}
                        className="px-2 py-1 text-xs border border-game-highlight/30 rounded text-game-highlight hover:bg-game-highlight/10 transition-colors">
                        {t('settings.active')}
                      </button>
                    )}
                    <button onClick={() => openEditModal(type, item)}
                      className="px-2 py-1 text-xs border border-game-muted/30 rounded text-game-muted hover:border-game-highlight hover:text-game-text transition-colors">
                      {t('settings.edit')}
                    </button>
                    <button onClick={() => handleDelete(type, item.id)}
                      className="px-2 py-1 text-xs border border-red-500/30 rounded text-red-400 hover:border-red-500 hover:bg-red-500/10 transition-colors">
                      {t('settings.del')}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-game-accent/30">
        <button onClick={() => setPage('home')} className="text-game-muted hover:text-game-text">{t('settings.back')}</button>
        <h1 className="text-xl font-bold text-game-highlight">{t('settings.title')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {renderConfigCards(t('settings.llmConfigs'), '\uD83E\uDDE0', configs, 'llm', settings.activeLlmConfigId ?? null, (item) => item.model || 'No model')}
          {renderConfigCards(t('settings.imageConfigs'), '\uD83C\uDFA8', imageConfigs, 'image', settings.activeImageConfigId ?? null, (item) => (item.model || 'No model') + ' \u00B7 ' + (item.size || '1024x1024'))}
          {renderConfigCards(t('settings.voiceConfigs'), '\uD83D\uDD0A', voiceConfigs, 'voice', settings.activeVoiceConfigId ?? null, (item) => (item.model || 'No model') + ' \u00B7 ' + (item.voice || 'alloy'))}

          {/* Image Frequency */}
          <section className="bg-game-panel rounded-xl p-6 border border-game-accent/20">
            <h2 className="text-lg font-semibold mb-4 text-game-highlight">{t('settings.imageFrequency')}</h2>
            <select value={form.imageFrequency}
              onChange={(e) => update('imageFrequency', e.target.value as 'conservative' | 'standard' | 'rich')}
              className={inputClass}>
              <option value="conservative">{t('settings.conservative')}</option>
              <option value="standard">{t('settings.standard')}</option>
              <option value="rich">{t('settings.rich')}</option>
            </select>
          </section>

          {/* Voice Auto-Play */}
          <section className="bg-game-panel rounded-xl p-6 border border-game-accent/20">
            <h2 className="text-lg font-semibold mb-4 text-game-highlight">{t('settings.autoPlayVoice')}</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.autoPlayVoice}
                onChange={(e) => update('autoPlayVoice', e.target.checked)}
                className="w-5 h-5 rounded accent-game-highlight" />
              <span className="text-sm text-game-muted">{t('settings.autoPlayVoiceDesc')}</span>
            </label>
          </section>

          {/* Language */}
          <section className="bg-game-panel rounded-xl p-6 border border-game-accent/20">
            <h2 className="text-lg font-semibold mb-4 text-game-highlight">{t('settings.language')}</h2>
            <select value={form.language}
              onChange={(e) => update('language', e.target.value as 'zh-TW' | 'en' | 'ja')}
              className={inputClass}>
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </section>

          <div className="flex gap-3">
            <button onClick={handleSave}
              className="flex-1 py-3 bg-game-highlight rounded-lg font-medium hover:bg-game-highlight/80 transition-colors">
              {t('settings.save')}
            </button>
            <button onClick={() => setPage('home')}
              className="px-6 py-3 border border-game-muted/30 rounded-lg text-game-muted hover:border-game-highlight hover:text-game-text transition-colors">
              {t('settings.cancel')}
            </button>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-game-panel rounded-2xl border border-game-accent/30 w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-game-highlight mb-5">
              {editingConfigId ? t('settings.editConfig') : t('settings.newConfig')} ({modalType === 'llm' ? t('settings.llmTab') : modalType === 'image' ? t('settings.imageTab') : t('settings.voiceTab')})
            </h3>

            {modalType === 'llm' && (
              <>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.nameRequired')}</label><input type="text" value={llmForm.name} onChange={(e) => setLlmForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. OpenAI GPT-4o" className={inputClass} /></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.provider')}</label><select value={llmForm.provider} onChange={(e) => setLlmForm((f) => ({ ...f, provider: e.target.value as LLMProviderType }))} className={inputClass}><option value="openai">OpenAI Compatible</option><option value="anthropic">Anthropic Compatible</option><option value="gemini">Google Gemini</option></select></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.modelName')}</label><input type="text" value={llmForm.model} onChange={(e) => setLlmForm((f) => ({ ...f, model: e.target.value }))} placeholder="e.g. gpt-4o" className={inputClass} /></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.apiKey')}</label><input type="password" value={llmForm.apiKey} onChange={(e) => setLlmForm((f) => ({ ...f, apiKey: e.target.value }))} placeholder="sk-..." className={inputClass} /></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.apiBaseUrl')} <span className="text-game-muted/50">{t('settings.apiBaseUrlHint')}</span></label><input type="text" value={llmForm.apiBaseUrl} onChange={(e) => setLlmForm((f) => ({ ...f, apiBaseUrl: e.target.value }))} placeholder="https://api.openai.com/v1" className={inputClass} /></div>
                <div className="mb-4 p-3 border-t border-game-accent/20">
                  <h4 className="text-sm font-semibold text-game-highlight mb-3">Parameters</h4>
                  <div className="space-y-4">
                    <div><div className="flex justify-between items-center mb-1"><label className="text-sm text-game-muted">Temperature</label><span className="text-xs text-game-highlight font-mono bg-game-bg px-2 py-0.5 rounded">{llmForm.temperature.toFixed(1)}</span></div><input type="range" min="0" max="2" step="0.1" value={llmForm.temperature} onChange={(e) => setLlmForm((f) => ({ ...f, temperature: parseFloat(e.target.value) }))} className="w-full h-2 bg-game-accent/20 rounded-lg appearance-none cursor-pointer accent-game-highlight" /></div>
                    <div><div className="flex justify-between items-center mb-1"><label className="text-sm text-game-muted">Top P</label><span className="text-xs text-game-highlight font-mono bg-game-bg px-2 py-0.5 rounded">{llmForm.topP.toFixed(2)}</span></div><input type="range" min="0" max="1" step="0.05" value={llmForm.topP} onChange={(e) => setLlmForm((f) => ({ ...f, topP: parseFloat(e.target.value) }))} className="w-full h-2 bg-game-accent/20 rounded-lg appearance-none cursor-pointer accent-game-highlight" /></div>
                    <div><label className="block text-sm text-game-muted mb-1">Max Output Tokens</label><input type="number" min="1" max="131072" value={llmForm.maxTokens} onChange={(e) => setLlmForm((f) => ({ ...f, maxTokens: parseInt(e.target.value) || 4096 }))} className={inputClass} /></div>
                    <div><div className="flex justify-between items-center mb-1"><label className="text-sm text-game-muted">Frequency Penalty</label><span className="text-xs text-game-highlight font-mono bg-game-bg px-2 py-0.5 rounded">{llmForm.frequencyPenalty.toFixed(1)}</span></div><input type="range" min="-2" max="2" step="0.1" value={llmForm.frequencyPenalty} onChange={(e) => setLlmForm((f) => ({ ...f, frequencyPenalty: parseFloat(e.target.value) }))} className="w-full h-2 bg-game-accent/20 rounded-lg appearance-none cursor-pointer accent-game-highlight" /></div>
                    <div><div className="flex justify-between items-center mb-1"><label className="text-sm text-game-muted">Presence Penalty</label><span className="text-xs text-game-highlight font-mono bg-game-bg px-2 py-0.5 rounded">{llmForm.presencePenalty.toFixed(1)}</span></div><input type="range" min="-2" max="2" step="0.1" value={llmForm.presencePenalty} onChange={(e) => setLlmForm((f) => ({ ...f, presencePenalty: parseFloat(e.target.value) }))} className="w-full h-2 bg-game-accent/20 rounded-lg appearance-none cursor-pointer accent-game-highlight" /></div>
                  </div>
                </div>
              </>
            )}

            {modalType === 'image' && (
              <>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.nameRequired')}</label><input type="text" value={imageForm.name} onChange={(e) => setImageForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. DALL-E 3" className={inputClass} /></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.provider')}</label><select value={imageForm.provider} onChange={(e) => setImageForm((f) => ({ ...f, provider: e.target.value as ImageProviderType }))} className={inputClass}><option value="openai">OpenAI DALL-E</option><option value="stability">Stability AI</option></select></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.model')}</label><input type="text" value={imageForm.model} onChange={(e) => setImageForm((f) => ({ ...f, model: e.target.value }))} placeholder="e.g. dall-e-3" className={inputClass} /></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.apiKey')}</label><input type="password" value={imageForm.apiKey} onChange={(e) => setImageForm((f) => ({ ...f, apiKey: e.target.value }))} placeholder="sk-..." className={inputClass} /></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.apiBaseUrl')} <span className="text-game-muted/50">(optional)</span></label><input type="text" value={imageForm.apiBaseUrl} onChange={(e) => setImageForm((f) => ({ ...f, apiBaseUrl: e.target.value }))} className={inputClass} /></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.size')}</label><select value={imageForm.size} onChange={(e) => setImageForm((f) => ({ ...f, size: e.target.value }))} className={inputClass}><option value="1024x1024">1024x1024</option><option value="1792x1024">1792x1024 (landscape)</option><option value="1024x1792">1024x1792 (portrait)</option></select></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.quality')}</label><select value={imageForm.quality} onChange={(e) => setImageForm((f) => ({ ...f, quality: e.target.value }))} className={inputClass}><option value="standard">Standard</option><option value="hd">HD</option></select></div>
              </>
            )}

            {modalType === 'voice' && (
              <>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.nameRequired')}</label><input type="text" value={voiceForm.name} onChange={(e) => setVoiceForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. OpenAI TTS" className={inputClass} /></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.provider')}</label><select value={voiceForm.provider} onChange={(e) => setVoiceForm((f) => ({ ...f, provider: e.target.value as VoiceProviderType }))} className={inputClass}><option value="openai">OpenAI TTS</option></select></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.model')}</label><select value={voiceForm.model} onChange={(e) => setVoiceForm((f) => ({ ...f, model: e.target.value }))} className={inputClass}><option value="tts-1">tts-1 (fast)</option><option value="tts-1-hd">tts-1-hd (quality)</option></select></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.apiKey')}</label><input type="password" value={voiceForm.apiKey} onChange={(e) => setVoiceForm((f) => ({ ...f, apiKey: e.target.value }))} placeholder="sk-..." className={inputClass} /></div>
                <div className="mb-4"><label className="block text-sm text-game-muted mb-1">{t('settings.voice')}</label><select value={voiceForm.voice} onChange={(e) => setVoiceForm((f) => ({ ...f, voice: e.target.value }))} className={inputClass}><option value="alloy">Alloy (neutral)</option><option value="echo">Echo (male)</option><option value="fable">Fable (British)</option><option value="onyx">Onyx (deep male)</option><option value="nova">Nova (female)</option><option value="shimmer">Shimmer (warm female)</option></select></div>
                <div className="mb-4"><div className="flex justify-between items-center mb-1"><label className="text-sm text-game-muted">{t('settings.speed')}</label><span className="text-xs text-game-highlight font-mono bg-game-bg px-2 py-0.5 rounded">{voiceForm.speed.toFixed(2)}</span></div><input type="range" min="0.25" max="4.0" step="0.05" value={voiceForm.speed} onChange={(e) => setVoiceForm((f) => ({ ...f, speed: parseFloat(e.target.value) }))} className="w-full h-2 bg-game-accent/20 rounded-lg appearance-none cursor-pointer accent-game-highlight" /></div>
              </>
            )}

            <div className="flex gap-3 pt-3 border-t border-game-accent/20">
              <button onClick={handleModalSave}
                disabled={(modalType === 'llm' && !llmForm.name.trim()) || (modalType === 'image' && !imageForm.name.trim()) || (modalType === 'voice' && !voiceForm.name.trim())}
                className="flex-1 py-2 bg-game-highlight rounded-lg font-medium hover:bg-game-highlight/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {t('common.save')}
              </button>
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-game-muted/30 rounded-lg text-game-muted hover:border-game-highlight hover:text-game-text transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}