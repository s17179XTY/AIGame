import React, { useState, useEffect } from 'react'
import { useI18n } from '../i18n'
import { useToast } from '../components/ToastProvider'
import type { Character, CharacterConfig } from '../../../main/services/types'

export interface CharacterFormData extends CharacterConfig {}

interface CharacterFormModalProps {
  mode: 'create' | 'edit'
  character?: Character | null
  onSave: (data: CharacterFormData) => void
  onClose: () => void
  worldId?: string
}

export default function CharacterFormModal({ mode, character, onSave, onClose, worldId }: CharacterFormModalProps) {
  const { t } = useI18n()
  const toast = useToast()
  const [form, setForm] = useState<CharacterFormData>({ name: '', nickname: '', gender: '', age: 0, appearance: '', personality: '', extraPrompt: '', imagePath: '' })
  useEffect(() => { if (mode === 'edit' && character) { setForm({ name: character.name || '', nickname: character.nickname || '', gender: character.gender || '', age: character.age || 0, appearance: character.appearance || '', personality: character.personality || '', extraPrompt: character.extraPrompt || '', imagePath: character.imagePath || '' }) } }, [mode, character])
  const update = <K extends keyof CharacterFormData>(key: K, value: CharacterFormData[K]) => { setForm(f => ({ ...f, [key]: value })) }
  const handleSubmit = () => { if (!form.name.trim() || !form.gender.trim() || !form.age || form.age <= 0) { toast.show(t('characterForm.fillRequired')); return } onSave(form) }
  const handleExport = async () => { try { const json = JSON.stringify(form, null, 2); await window.api.util.saveFile('character-' + (form.name || 'export') + '.json', json) } catch (err: any) { toast.show(t('characterForm.exportFailed') + ': ' + (err.message || '')) } }
  const handleImport = async () => { try { const result = await window.api.util.openFile(); if (result) { const data = JSON.parse(result) as CharacterFormData; setForm({ name: data.name || '', nickname: data.nickname || '', gender: data.gender || '', age: data.age || 0, appearance: data.appearance || '', personality: data.personality || '', extraPrompt: data.extraPrompt || '', imagePath: data.imagePath || '' }); toast.show(t('characterForm.importSuccess')) } } catch (err: any) { toast.show(t('characterForm.importFailed') + ': ' + (err.message || '')) } }
  const ic = 'w-full px-4 py-2.5 rounded-xl bg-game-panel border border-white/[0.10] text-game-text placeholder-game-muted/50 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all'; const tc = ic + ' resize-y min-h-[80px]'; const lc = 'block text-sm font-medium text-game-muted mb-1.5'
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-12 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-game-panel rounded-2xl border border-game-accent/30 w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-game-highlight mb-5">{mode === 'create' ? t('characterForm.createTitle') : t('characterForm.editTitle')}</h3>
        <div className="space-y-4">
          <p className="text-xs text-game-muted/60 italic bg-game-accent/5 rounded-lg px-3 py-2 border border-game-accent/10">{t('characterForm.aiHint')}</p>
          <div><label className={lc}>{t('characterForm.name')} <span className="text-red-400">*</span></label><input value={form.name} onChange={e => update('name', e.target.value)} className={ic} placeholder="e.g. Alice" /></div>
          <div><label className={lc}>{t('characterForm.nickname')}</label><input value={form.nickname} onChange={e => update('nickname', e.target.value)} className={ic} placeholder="e.g. Al" /></div>
          <div><label className={lc}>{t('characterForm.gender')} <span className="text-red-400">*</span></label><input value={form.gender} onChange={e => update('gender', e.target.value)} className={ic} placeholder="e.g. Female" /></div>
          <div><label className={lc}>{t('characterForm.age')} <span className="text-red-400">*</span></label><input type="number" value={form.age || ''} onChange={e => update('age', parseInt(e.target.value) || 0)} className={ic} placeholder="e.g. 17" min="0" /></div>
          <div><label className={lc}>{t('characterForm.appearance')}</label><textarea value={form.appearance} onChange={e => update('appearance', e.target.value)} className={tc} placeholder="e.g. Long black hair..." /></div>
          <div><label className={lc}>{t('characterForm.personality')}</label><textarea value={form.personality} onChange={e => update('personality', e.target.value)} className={tc} placeholder="e.g. Gentle and kind..." /></div>
          <div><label className={lc}>{t('characterForm.extraPrompt')}</label><textarea value={form.extraPrompt} onChange={e => update('extraPrompt', e.target.value)} className={tc} placeholder="e.g. Extra AI hints..." /></div>
          <div><label className={lc}>{t('characterForm.imagePath')}</label><input value={form.imagePath} onChange={e => update('imagePath', e.target.value)} className={ic} placeholder="/path/to/image.png" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-game-highlight rounded-lg font-medium text-white hover:bg-game-highlight/80 transition-colors">{mode === 'create' ? t('characterForm.createTitle') : t('common.save')}</button>
          <button onClick={onClose} className="px-5 py-2.5 border border-game-muted/30 rounded-lg text-game-muted hover:border-game-highlight hover:text-game-text transition-colors">{t('common.cancel')}</button>
        </div>
        <div className="flex gap-3 mt-4 pt-4 border-t border-white/[0.07]">
          <button onClick={handleExport} className="flex-1 py-1.5 text-xs border border-game-accent/20 rounded-lg text-game-muted hover:border-game-highlight/40 hover:text-game-text transition-colors">{t('characterForm.export')}</button>
          <button onClick={handleImport} className="flex-1 py-1.5 text-xs border border-game-accent/20 rounded-lg text-game-muted hover:border-game-highlight/40 hover:text-game-text transition-colors">{t('characterForm.import')}</button>
        </div>
      </div>
    </div>
  )
}
