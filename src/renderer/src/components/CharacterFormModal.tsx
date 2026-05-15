import React, { useState, useEffect } from 'react'
import { useI18n } from '../i18n'
import { useToast } from './ToastProvider'
import type { CharacterConfig, Character } from '../../../main/services/types'

interface Props {
  mode: 'create' | 'edit'
  character?: Character
  worldId?: string
  onSave: (config: CharacterConfig & { imagePath?: string }) => Promise<void>
  onClose: () => void
}

export default function CharacterFormModal({ mode, character, worldId, onSave, onClose }: Props) {
  const { t } = useI18n()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CharacterConfig & { imagePath?: string }>({
    name: '',
    nickname: '',
    gender: '',
    age: 0,
    appearance: '',
    personality: '',
    extraPrompt: '',
    imagePath: undefined,
  })

  useEffect(() => {
    if (mode === 'edit' && character) {
      setForm({
        name: character.name,
        nickname: character.nickname || '',
        gender: character.gender,
        age: character.age,
        appearance: character.appearance,
        personality: character.personality,
        extraPrompt: character.extraPrompt,
        imagePath: character.imagePath,
      })
    }
  }, [mode, character])

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.gender.trim() || !form.age) {
      toast.show(t('characterForm.fillRequired'))
      return
    }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err: any) {
      toast.show((err.message ?? t('common.unknownError')))
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e: any) => {
      const file = e.target.files?.[0]
      if (file) {
        setForm((f) => ({ ...f, imagePath: file.path }))
      }
    }
    input.click()
  }

  const handleExport = async () => {
    const jsonStr = JSON.stringify(form, null, 2)
    await window.api.util.saveFile('character.json', jsonStr)
  }

  const handleImport = async () => {
    const content = await window.api.util.openFile()
    if (!content) return
    try {
      const parsed = JSON.parse(content)
      setForm({
        name: parsed.name || '',
        nickname: parsed.nickname || '',
        gender: parsed.gender || '',
        age: parsed.age || 0,
        appearance: parsed.appearance || '',
        personality: parsed.personality || '',
        extraPrompt: parsed.extraPrompt || '',
        imagePath: parsed.imagePath || undefined,
      })
      toast.show(t('characterForm.importSuccess'))
    } catch {
      toast.show(t('characterForm.importFailed'))
    }
  }

  const inputClass = 'w-full bg-game-bg border border-game-accent/30 rounded-lg px-3 py-2 text-game-text focus:border-game-highlight outline-none text-sm'
  const textareaClass = 'w-full bg-game-bg border border-game-accent/30 rounded-lg px-3 py-2 text-game-text focus:border-game-highlight outline-none text-sm resize-y'

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
      <div className='bg-game-panel rounded-2xl border border-game-accent/30 w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-game-accent/20'>
          <h3 className='text-lg font-semibold text-game-highlight'>
            {mode === 'edit' ? t('characterForm.editTitle') : t('characterForm.createTitle')}
          </h3>
          <button onClick={onClose} className='text-game-muted hover:text-game-text text-xl'>&times;</button>
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto p-6 space-y-4'>
          {/* AI Hint */}
          <div className='text-xs text-game-muted/70 bg-game-bg/50 rounded-lg px-3 py-2 border border-game-accent/10'>
            {t('characterForm.aiHint')}
          </div>

          {/* Name */}
          <div>
            <label className='block text-xs text-game-muted mb-1'>{t('characterForm.name')} *</label>
            <input type='text' value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass} />
          </div>

          {/* Nickname */}
          <div>
            <label className='block text-xs text-game-muted mb-1'>{t('characterForm.nickname')}</label>
            <input type='text' value={form.nickname || ''}
              onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
              className={inputClass} />
          </div>

          {/* Gender + Age */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs text-game-muted mb-1'>{t('characterForm.gender')} *</label>
              <input type='text' value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                placeholder='ÄÐ / Å® / ÆäËû'
                className={inputClass} />
            </div>
            <div>
              <label className='block text-xs text-game-muted mb-1'>{t('characterForm.age')} *</label>
              <input type='number' value={form.age || ''}
                onChange={(e) => setForm((f) => ({ ...f, age: parseInt(e.target.value) || 0 }))}
                className={inputClass} />
            </div>
          </div>

          {/* Appearance */}
          <div>
            <label className='block text-xs text-game-muted mb-1'>{t('characterForm.appearance')}</label>
            <textarea value={form.appearance}
              onChange={(e) => setForm((f) => ({ ...f, appearance: e.target.value }))}
              rows={3} className={textareaClass} />
          </div>

          {/* Personality */}
          <div>
            <label className='block text-xs text-game-muted mb-1'>{t('characterForm.personality')}</label>
            <textarea value={form.personality}
              onChange={(e) => setForm((f) => ({ ...f, personality: e.target.value }))}
              rows={3} className={textareaClass} />
          </div>

          {/* Extra Prompt */}
          <div>
            <label className='block text-xs text-game-muted mb-1'>{t('characterForm.extraPrompt')}</label>
            <textarea value={form.extraPrompt}
              onChange={(e) => setForm((f) => ({ ...f, extraPrompt: e.target.value }))}
              rows={3} className={textareaClass} />
          </div>

          {/* Image */}
          <div>
            <label className='block text-xs text-game-muted mb-1'>{t('characterForm.image')}</label>
            <div className='flex items-center gap-3'>
              <button onClick={handleImageUpload}
                className='px-3 py-1.5 text-xs border border-game-highlight/30 rounded-lg text-game-highlight hover:bg-game-highlight/10'>
                {form.imagePath ? t('characterForm.changeImage') : t('characterForm.uploadImage')}
              </button>
              {form.imagePath && (
                <img src={`file://${form.imagePath}`} alt='preview'
                  className='w-12 h-12 rounded-lg object-cover border border-white/10' />
              )}
            </div>
          </div>

          {/* Export / Import */}
          <div className='flex gap-2'>
            <button onClick={handleExport}
              className='flex-1 py-2 text-xs border border-game-accent/20 rounded-lg text-game-muted hover:border-game-highlight/30 hover:text-game-text transition-colors'>
              {t('characterForm.export')}
            </button>
            <button onClick={handleImport}
              className='flex-1 py-2 text-xs border border-game-accent/20 rounded-lg text-game-muted hover:border-game-highlight/30 hover:text-game-text transition-colors'>
              {t('characterForm.import')}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className='flex gap-3 px-6 py-4 border-t border-game-accent/20'>
          <button onClick={onClose}
            className='flex-1 py-2 text-sm border border-game-accent/20 rounded-xl text-game-muted hover:text-game-text transition-colors'>
            {t('common.cancel')}
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className='flex-1 py-2 text-sm bg-game-highlight rounded-xl font-medium hover:bg-game-highlight/80 disabled:opacity-50 transition-colors'>
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
