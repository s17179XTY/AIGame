import React, { useState, useEffect } from 'react'
import { useI18n } from '../i18n'
import { useToast } from './ToastProvider'
import type { World, Character, WorldConfig, CharacterConfig } from '../../../main/services/types'

interface Props {
  worldId: string
  onClose: () => void
  onWorldUpdated: (world: World) => void
}

export default function WorldSettingsModal({ worldId, onClose, onWorldUpdated }: Props) {
  const { t } = useI18n()
  const toast = useToast()
  const [tab, setTab] = useState<'world' | 'characters'>('world')
  const [world, setWorld] = useState<World | null>(null)
  const [config, setConfig] = useState<WorldConfig>({
    name: '',
    worldview: '',
    rules: '',
    systemPrompt: '',
    initialScene: '',
  })
  const [characters, setCharacters] = useState<Character[]>([])
  const [editingChar, setEditingChar] = useState<Character | null>(null)
  const [showAddCharForm, setShowAddCharForm] = useState(false)
  const [charForm, setCharForm] = useState<CharacterConfig & { imagePath?: string }>({
    name: '',
    nickname: '',
    gender: '',
    age: 0,
    appearance: '',
    personality: '',
    extraPrompt: '',
    imagePath: undefined,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [worldId])

  const loadData = async () => {
    const w = await window.api.world.get(worldId)
    if (w) {
      setWorld(w)
      setConfig({ ...w.config })
    }
    const chars = await window.api.character.list(worldId)
    setCharacters(chars)
  }

  const handleSaveWorld = async () => {
    if (!config.name.trim() || !config.worldview.trim()) {
      toast.show(t('worldCreate.fillRequired'))
      return
    }
    setSaving(true)
    try {
      const updated = await window.api.world.update(worldId, config)
      setWorld(updated)
      onWorldUpdated(updated)
      toast.show(t('worldCreate.createBtn'))
    } catch (err: any) {
      toast.show(t('worldSettingsModal.saveFailed') + ': ' + (err.message ?? t('common.unknownError')))
    } finally {
      setSaving(false)
    }
  }

  const openEditChar = (char: Character) => {
    setShowAddCharForm(false)
    setEditingChar(char)
    setCharForm({
      name: char.name,
      nickname: char.nickname || '',
      gender: char.gender,
      age: char.age,
      appearance: char.appearance,
      personality: char.personality,
      extraPrompt: char.extraPrompt,
      imagePath: char.imagePath,
    })
  }

  const handleSaveChar = async () => {
    if (!editingChar) return
    setSaving(true)
    try {
      await window.api.character.update(editingChar.id, charForm)
      const chars = await window.api.character.list(worldId)
      setCharacters(chars)
      setEditingChar(null)
    } catch (err: any) {
      toast.show(t('worldSettingsModal.saveFailed') + ': ' + (err.message ?? t('common.unknownError')))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteChar = async (id: string) => {
    const ok = await toast.confirm(t('worldSettingsModal.deleteCharConfirm'))
    if (!ok) return
    try {
      await window.api.character.delete(id)
      const chars = await window.api.character.list(worldId)
      setCharacters(chars)
    } catch (err: any) {
      toast.show(t('worldSettingsModal.deleteFailed') + ': ' + (err.message ?? t('common.unknownError')))
    }
  }


  const handleCreateChar = async () => {
    if (!charForm.name.trim() || !charForm.gender.trim()) {
      toast.show(t('worldCreate.fillCharRequired'))
      return
    }
    setSaving(true)
    try {
      await window.api.character.create(worldId, charForm, false, false)
      const chars = await window.api.character.list(worldId)
      setCharacters(chars)
      setShowAddCharForm(false)
      setCharForm({
        name: '',
        nickname: '',
        gender: '',
        age: 0,
        appearance: '',
        personality: '',
        extraPrompt: '',
        imagePath: undefined,
      })
      toast.show(t('worldSettingsModalForm.saveCharacter'))
    } catch (err: any) {
      toast.show(t('worldSettingsModal.saveFailed') + ': ' + (err.message ?? t('common.unknownError')))
    } finally {
      setSaving(false)
    }
  }

  const handleCharImageUpload = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0]
      if (file) {
        setCharForm((f) => ({ ...f, imagePath: file.path }))
      }
    }
    input.click()
  }

  const inputClass = 'w-full bg-game-bg border border-game-accent/30 rounded-lg px-3 py-2 text-game-text focus:border-game-highlight outline-none text-sm'
  const textareaClass = 'w-full bg-game-bg border border-game-accent/30 rounded-lg px-3 py-2 text-game-text focus:border-game-highlight outline-none text-sm resize-y'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-game-panel rounded-2xl border border-game-accent/30 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-game-accent/20">
          <h3 className="text-lg font-semibold text-game-highlight">
            {world?.name ?? 'World'} ¡¤ {t('worldSettingsModalForm.worldSettings')}
          </h3>
          <button onClick={onClose} className="text-game-muted hover:text-game-text text-xl">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-game-accent/20">
          <button
            onClick={() => setTab('world')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'world'
                ? 'text-game-highlight border-b-2 border-game-highlight'
                : 'text-game-muted hover:text-game-text'
            }`}
          >
            {t('worldSettingsModalForm.worldSettings')}
          </button>
          <button
            onClick={() => setTab('characters')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'characters'
                ? 'text-game-highlight border-b-2 border-game-highlight'
                : 'text-game-muted hover:text-game-text'
            }`}
          >
            {t('worldSettingsModalForm.characters')} ({characters.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'world' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-game-muted mb-1">{t('worldSettingsModalForm.name')} *</label>
                <input type="text" value={config.name}
                  onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-game-muted mb-1">{t('worldSettingsModalForm.worldview')} *</label>
                <textarea value={config.worldview}
                  onChange={(e) => setConfig((c) => ({ ...c, worldview: e.target.value }))}
                  rows={4} className={textareaClass} />
              </div>
              <div>
                <label className="block text-sm text-game-muted mb-1">{t('worldSettingsModalForm.rules')}</label>
                <textarea value={config.rules}
                  onChange={(e) => setConfig((c) => ({ ...c, rules: e.target.value }))}
                  rows={3} className={textareaClass} />
              </div>
              <div>
                <label className="block text-sm text-game-muted mb-1">{t('worldSettingsModalForm.systemPrompt')}</label>
                <textarea value={config.systemPrompt}
                  onChange={(e) => setConfig((c) => ({ ...c, systemPrompt: e.target.value }))}
                  rows={3} className={textareaClass} />
              </div>
              <div>
                <label className="block text-sm text-game-muted mb-1">{t('worldSettingsModalForm.initialScene')}</label>
                <textarea value={config.initialScene}
                  onChange={(e) => setConfig((c) => ({ ...c, initialScene: e.target.value }))}
                  rows={2} className={textareaClass} />
              </div>
              <button onClick={handleSaveWorld} disabled={saving}
                className="w-full py-2.5 bg-game-highlight rounded-xl font-medium hover:bg-game-highlight/80 transition-colors disabled:opacity-50">
                {saving ? t('worldSettingsModal.saving') : t('worldSettingsModal.saveWorld')}
              </button>
            </div>
          )}

          {tab === 'characters' && (
            <div>
              {editingChar ? (
                <div className="space-y-4">
                  <button onClick={() => setEditingChar(null)}
                    className="text-sm text-game-muted hover:text-game-text mb-2">&larr; {t('worldSettingsModal.backToList')}</button>
                  <div>
                    <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.nickname')}</label>
                    <input type="text" value={charForm.nickname || ''}
                      onChange={(e) => setCharForm((f) => ({ ...f, nickname: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.name')}</label>
                      <input type="text" value={charForm.name}
                        onChange={(e) => setCharForm((f) => ({ ...f, name: e.target.value }))}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.gender')}</label>
                      <input type="text" value={charForm.gender}
                        onChange={(e) => setCharForm((f) => ({ ...f, gender: e.target.value }))}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.age')}</label>
                      <input type="number" value={charForm.age || ''}
                        onChange={(e) => setCharForm((f) => ({ ...f, age: parseInt(e.target.value) || 0 }))}
                        className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.appearance')}</label>
                    <input type="text" value={charForm.appearance}
                      onChange={(e) => setCharForm((f) => ({ ...f, appearance: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.personality')}</label>
                    <textarea value={charForm.personality}
                      onChange={(e) => setCharForm((f) => ({ ...f, personality: e.target.value }))}
                      rows={2} className={textareaClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.image')}</label>
                    <div className="flex items-center gap-3">
                      <button onClick={handleCharImageUpload}
                        className="px-3 py-1.5 text-xs border border-game-highlight/30 rounded-lg text-game-highlight hover:bg-game-highlight/10">
                        {charForm.imagePath ? t('worldSettingsModalForm.change') : t('worldSettingsModalForm.upload')}
                      </button>
                      {charForm.imagePath && (
                        <img src={`file://${charForm.imagePath}`} alt="preview"
                          className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.extraPrompt')}</label>
                    <textarea value={charForm.extraPrompt}
                      onChange={(e) => setCharForm((f) => ({ ...f, extraPrompt: e.target.value }))}
                      rows={3} className={textareaClass} />
                  </div>
                  <button onClick={handleSaveChar} disabled={saving}
                    className="w-full py-2 bg-game-highlight rounded-xl font-medium hover:bg-game-highlight/80 disabled:opacity-50">
                    {t('worldSettingsModalForm.saveCharacter')}
                  </button>
                </div>
              ) : showAddCharForm ? (
                <div className="space-y-3">
                  <button onClick={() => { setShowAddCharForm(false); setCharForm({ name: '', nickname: '', gender: '', age: 0, appearance: '', personality: '', extraPrompt: '', imagePath: undefined }) }}
                    className="text-xs text-game-muted hover:text-game-text">
                    &larr; {t('worldSettingsModal.backToList')}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.name')} *</label>
                      <input type="text" value={charForm.name}
                        onChange={(e) => setCharForm((f) => ({ ...f, name: e.target.value }))}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.nickname')}</label>
                      <input type="text" value={charForm.nickname}
                        onChange={(e) => setCharForm((f) => ({ ...f, nickname: e.target.value }))}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.gender')} *</label>
                      <input type="text" value={charForm.gender}
                        onChange={(e) => setCharForm((f) => ({ ...f, gender: e.target.value }))}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.age')}</label>
                      <input type="number" value={charForm.age || ''}
                        onChange={(e) => setCharForm((f) => ({ ...f, age: parseInt(e.target.value) || 0 }))}
                        className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.appearance')}</label>
                    <input type="text" value={charForm.appearance}
                      onChange={(e) => setCharForm((f) => ({ ...f, appearance: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.personality')}</label>
                    <textarea value={charForm.personality}
                      onChange={(e) => setCharForm((f) => ({ ...f, personality: e.target.value }))}
                      rows={2} className={textareaClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.image')}</label>
                    <div className="flex items-center gap-3">
                      <button onClick={handleCharImageUpload}
                        className="px-3 py-1.5 text-xs border border-game-highlight/30 rounded-lg text-game-highlight hover:bg-game-highlight/10">
                        {charForm.imagePath ? t('worldSettingsModalForm.change') : t('worldSettingsModalForm.upload')}
                      </button>
                      {charForm.imagePath && (
                        <img src={`file://${charForm.imagePath}`} alt="preview"
                          className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-game-muted mb-1">{t('worldSettingsModalForm.extraPrompt')}</label>
                    <textarea value={charForm.extraPrompt}
                      onChange={(e) => setCharForm((f) => ({ ...f, extraPrompt: e.target.value }))}
                      rows={3} className={textareaClass} />
                  </div>
                  <button onClick={handleCreateChar} disabled={saving}
                    className="w-full py-2 bg-game-highlight rounded-xl font-medium hover:bg-game-highlight/80 disabled:opacity-50">
                    {t('worldSettingsModalForm.addCharacter')}
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => setShowAddCharForm(true)}
                    className="w-full py-2 mb-3 text-sm border border-dashed border-game-accent/40 rounded-xl text-game-muted hover:text-game-text hover:border-game-accent/60 transition-colors">
                    + {t('worldSettingsModalForm.addCharacter')}
                  </button>
                  <div className="grid gap-3">
                  {characters.map((char) => (
                    <div key={char.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-game-accent/20 bg-game-bg/30 hover:border-game-accent/40 transition-colors cursor-pointer"
                      onClick={() => openEditChar(char)}
                    >
                      {char.imagePath ? (
                        <img src={`file://${char.imagePath}`} alt={char.name}
                          className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-game-panel flex items-center justify-center text-lg shrink-0">
                          {char.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-game-text">{char.name}</span>
                          {char.isPlayer && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-game-highlight/20 text-game-highlight">{t('worldSettingsModalForm.player')}</span>
                          )}
                        </div>
                        <p className="text-xs text-game-muted">{char.gender} ¡¤ {char.age}yo</p>
                        <p className="text-xs text-game-muted/60 truncate">{char.personality}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteChar(char.id) }}
                        className="px-2 py-1 text-xs border border-red-500/30 rounded text-red-400 hover:border-red-500 shrink-0">
                        {t('worldSettingsModalForm.del')}
                      </button>
                    </div>
                  ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}