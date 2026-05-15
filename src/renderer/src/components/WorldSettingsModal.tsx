import React, { useState, useEffect } from 'react'
import { useI18n } from '../i18n'
import { useToast } from './ToastProvider'
import type { World, Character, WorldConfig } from '../../../main/services/types'
import CharacterFormModal, { CharacterFormData } from './CharacterFormModal'

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
  const [config, setConfig] = useState<WorldConfig>({ name: '', worldview: '', rules: '', systemPrompt: '', initialScene: '' })
  const [characters, setCharacters] = useState<Character[]>([])
  const [saving, setSaving] = useState(false)
  const [showCharForm, setShowCharForm] = useState(false)
  const [editCharTarget, setEditCharTarget] = useState<Character | null>(null)

  useEffect(() => { loadData() }, [worldId])

  const loadData = async () => {
    const w = await window.api.world.get(worldId)
    if (w) { setWorld(w); setConfig({ ...w.config }) }
    const chars = await window.api.character.list(worldId)
    setCharacters(chars)
  }

  const handleSaveWorld = async () => {
    if (!config.name.trim() || !config.worldview.trim()) { toast.show(t('worldCreate.fillRequired')); return }
    setSaving(true)
    try {
      const updated = await window.api.world.update(worldId, config)
      setWorld(updated)
      onWorldUpdated(updated)
      toast.show(t('worldSettingsModal.saved'))
    } catch (err: any) {
      toast.show(t('worldSettingsModal.saveFailed') + ': ' + (err.message || ''))
    } finally { setSaving(false) }
  }

  const handleAddCharacter = async (data: CharacterFormData) => {
    try {
      await window.api.character.create(worldId, data)
      setShowCharForm(false)
      loadData()
    } catch (err: any) {
      toast.show(t('common.error') + ': ' + (err.message || ''))
    }
  }

  const handleUpdateCharacter = async (data: CharacterFormData) => {
    if (!editCharTarget) return
    try {
      await window.api.character.update(editCharTarget.id, data)
      setEditCharTarget(null)
      setShowCharForm(false)
      loadData()
    } catch (err: any) {
      toast.show(t('common.error') + ': ' + (err.message || ''))
    }
  }

  const handleDeleteChar = async (id: string) => {
    const ok = await toast.confirm(t('worldSettingsModal.deleteCharConfirm'))
    if (!ok) return
    try {
      await window.api.character.delete(id)
      loadData()
    } catch (err: any) {
      toast.show(t('worldSettingsModal.deleteFailed') + ': ' + (err.message || ''))
    }
  }

  const openEditChar = (char: Character) => {
    setEditCharTarget(char)
    setShowCharForm(true)
  }

  const openAddChar = () => {
    setEditCharTarget(null)
    setShowCharForm(true)
  }

  const ic = 'w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-4 py-2.5 text-game-text placeholder-game-muted/40 focus:border-indigo-500/40 focus:bg-white/[0.07] outline-none transition-all'
  const tc = ic + ' resize-y min-h-[80px]'
  const lc = 'block text-sm font-medium text-game-muted mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-12 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-game-panel rounded-2xl border border-game-accent/30 w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-game-highlight">{t('worldSettingsModal.title')}</h3>
          <button onClick={onClose} className="text-game-muted hover:text-game-text">{t('common.close')}</button>
        </div>

        <div className="flex border-b border-white/[0.07] mb-5">
          <button onClick={() => setTab('world')} className={`px-4 py-2 text-sm ${tab === 'world' ? 'border-b-2 border-indigo-400 text-indigo-300' : 'text-game-muted'}`}>{t('worldSettingsModal.worldSettings')}</button>
          <button onClick={() => setTab('characters')} className={`px-4 py-2 text-sm ${tab === 'characters' ? 'border-b-2 border-indigo-400 text-indigo-300' : 'text-game-muted'}`}>{t('worldSettingsModal.characters')}</button>
        </div>

        {tab === 'world' && (
          <div className="space-y-4">
            <div><label className={lc}>{t('worldCreate.worldName')}</label><input value={config.name} onChange={e => setConfig(c => ({ ...c, name: e.target.value }))} className={ic} /></div>
            <div><label className={lc}>{t('worldCreate.worldview')}</label><textarea value={config.worldview} onChange={e => setConfig(c => ({ ...c, worldview: e.target.value }))} rows={3} className={tc} /></div>
            <div><label className={lc}>{t('worldCreate.rules')}</label><textarea value={config.rules} onChange={e => setConfig(c => ({ ...c, rules: e.target.value }))} rows={2} className={tc} /></div>
            <div><label className={lc}>{t('worldCreate.systemPrompt')}</label><textarea value={config.systemPrompt} onChange={e => setConfig(c => ({ ...c, systemPrompt: e.target.value }))} rows={2} className={tc} /></div>
            <div><label className={lc}>{t('worldCreate.initialScene')}</label><input value={config.initialScene} onChange={e => setConfig(c => ({ ...c, initialScene: e.target.value }))} className={ic} /></div>
            <button onClick={handleSaveWorld} disabled={saving} className="w-full py-3 bg-game-highlight rounded-lg font-medium text-white hover:bg-game-highlight/80 transition-colors disabled:opacity-50">
              {saving ? t('worldSettingsModal.saving') : t('worldSettingsModal.saveWorld')}
            </button>
          </div>
        )}

        {tab === 'characters' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-game-muted">{characters.length} {t('worldSettingsModal.characters')}</span>
              <button onClick={openAddChar} className="px-4 py-2 rounded-xl border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/[0.06] hover:border-indigo-500/40 transition-all text-sm">+ {t('worldSettingsModal.addCharacter')}</button>
            </div>
            {characters.length === 0 && <p className="text-sm text-game-muted py-8 text-center">{t('worldSettingsModal.noCharacters')}</p>}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {characters.map(char => (
                <div key={char.id} className="flex items-center justify-between p-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-indigo-500/20 transition-all">
                  <div onClick={() => openEditChar(char)} className="flex-1 cursor-pointer">
                    <span className="font-medium text-game-text">{char.name}</span>
                    <span className="text-xs text-game-muted ml-2">{char.gender} {char.age}{t('characterForm.ageUnit')}</span>
                    {char.isPlayer && <span className="text-xs text-indigo-400 ml-2">[{t('worldSettingsModal.player')}]</span>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDeleteChar(char.id) }} className="px-2 py-1 text-xs text-red-400/70 hover:text-red-300 hover:bg-red-500/10 rounded transition-all">{t('common.delete')}</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCharForm && (
        <CharacterFormModal
          mode={editCharTarget ? 'edit' : 'create'}
          character={editCharTarget}
          onSave={editCharTarget ? handleUpdateCharacter : handleAddCharacter}
          onClose={() => { setShowCharForm(false); setEditCharTarget(null) }}
          worldId={worldId}
        />
      )}
    </div>
  )
}
