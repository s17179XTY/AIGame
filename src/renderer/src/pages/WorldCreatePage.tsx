import React, { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { useI18n } from '../i18n'
import { useToast } from '../components/ToastProvider'
import CharacterFormModal, { CharacterFormData } from '../components/CharacterFormModal'
import type { WorldConfig, CharacterConfig, Character } from '../../../main/services/types'

export default function WorldCreatePage() {
  const { t } = useI18n()
  const toast = useToast()
  const setPage = useAppStore((s) => s.setPage)
  const selectWorld = useAppStore((s) => s.selectWorld)

  const [worldConfig, setWorldConfig] = useState<WorldConfig>({ name: '', worldview: '', rules: '', systemPrompt: '', initialScene: '' })
  const [playerConfig, setPlayerConfig] = useState<CharacterConfig>({ name: '', gender: '', age: 0, appearance: '', personality: '', extraPrompt: '' })
  const [importantChars, setImportantChars] = useState<CharacterConfig[]>([])
  const [creating, setCreating] = useState(false)
  const [showCharModal, setShowCharModal] = useState(false)
  const [globalChars, setGlobalChars] = useState<Character[]>([])
  const [selectedGlobalIds, setSelectedGlobalIds] = useState<Set<string>>(new Set())

  useEffect(() => { window.api.character.listGlobal().then(chars => setGlobalChars(chars || [])) }, [])

  const toggleGlobalChar = async (char: Character) => {
    const newSet = new Set(selectedGlobalIds)
    if (newSet.has(char.id)) {
      newSet.delete(char.id)
      setImportantChars(chars => chars.filter(c => c.name !== char.name))
    } else {
      newSet.add(char.id)
      setImportantChars(chars => [...chars, { name: char.name, nickname: char.nickname || '', gender: char.gender, age: char.age, appearance: char.appearance, personality: char.personality, extraPrompt: char.extraPrompt, imagePath: char.imagePath }])
    }
    setSelectedGlobalIds(newSet)
  }

  const handleSaveChar = (data: CharacterFormData) => {
    setImportantChars([...importantChars, data])
    setShowCharModal(false)
  }

  const removeImportantChar = (index: number) => setImportantChars(chars => chars.filter((_, i) => i !== index))

  const updateWorld = <K extends keyof WorldConfig>(key: K, value: WorldConfig[K]) => setWorldConfig(w => ({ ...w, [key]: value }))
  const updatePlayer = <K extends keyof CharacterConfig>(key: K, value: CharacterConfig[K]) => setPlayerConfig(p => ({ ...p, [key]: value }))

  const handleCreate = async () => {
    if (!worldConfig.name || !worldConfig.worldview) { toast.show(t('worldCreate.fillRequired')); return }
    if (!playerConfig.name || !playerConfig.gender || !playerConfig.age) { toast.show(t('characterForm.fillRequired')); return }
    setCreating(true)
    try {
      const world = await window.api.world.create(worldConfig)
      await window.api.character.create(world.id, playerConfig, true, false)
      for (const char of importantChars) {
        if (char.name) await window.api.character.create(world.id, char, false, false)
      }
      selectWorld(world.id)
      setPage('game')
    } catch (err: any) {
      toast.show(t('worldCreate.createFailed') + ': ' + (err.message || ''))
    } finally { setCreating(false) }
  }

  const ic = 'w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-4 py-2.5 text-game-text placeholder-game-muted/40 focus:border-indigo-500/40 focus:bg-white/[0.07] outline-none transition-all duration-200'
  const tc = ic + ' resize-y min-h-[80px]'
  const lc = 'block text-sm font-medium text-game-muted mb-1.5'

  return (
    <div className="h-screen flex flex-col bg-game-bg">
      <header className="flex items-center gap-4 px-8 py-5 border-b border-white/[0.07]">
        <button onClick={() => setPage('home')} className="px-3 py-1.5 rounded-lg border border-white/[0.10] text-game-muted hover:border-indigo-500/40 hover:text-indigo-300 transition-all">{t('worldCreate.back')}</button>
        <h1 className="text-lg font-bold">{t('worldCreate.title')}</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* World Settings */}
          <section className="bg-game-panel/60 rounded-2xl border border-white/[0.07] p-6">
            <h2 className="text-lg font-semibold mb-5 text-game-highlight">{t('worldCreate.worldSettings')}</h2>
            <div className="space-y-4">
              <div><label className={lc}>{t('worldCreate.worldName')} <span className="text-red-400">*</span></label><input value={worldConfig.name} onChange={e => updateWorld('name', e.target.value)} placeholder={t('worldCreate.worldNamePlaceholder')} className={ic} /></div>
              <div><label className={lc}>{t('worldCreate.worldview')} <span className="text-red-400">*</span></label><textarea value={worldConfig.worldview} onChange={e => updateWorld('worldview', e.target.value)} placeholder={t('worldCreate.worldviewPlaceholder')} rows={3} className={tc} /></div>
              <div><label className={lc}>{t('worldCreate.rules')}</label><textarea value={worldConfig.rules} onChange={e => updateWorld('rules', e.target.value)} placeholder={t('worldCreate.rulesPlaceholder')} rows={2} className={tc} /></div>
              <div><label className={lc}>{t('worldCreate.systemPrompt')}</label><textarea value={worldConfig.systemPrompt} onChange={e => updateWorld('systemPrompt', e.target.value)} placeholder={t('worldCreate.systemPromptPlaceholder')} rows={2} className={tc} /></div>
              <div><label className={lc}>{t('worldCreate.initialScene')}</label><input value={worldConfig.initialScene} onChange={e => updateWorld('initialScene', e.target.value)} placeholder={t('worldCreate.initialScenePlaceholder')} className={ic} /></div>
            </div>
          </section>

          {/* Player Character */}
          <section className="bg-game-panel/60 rounded-2xl border border-white/[0.07] p-6">
            <h2 className="text-lg font-semibold mb-5 text-game-highlight">{t('characterForm.title')}</h2>
            <p className="text-xs text-game-muted/60 italic bg-game-accent/5 rounded-lg px-3 py-2 mb-4 border border-game-accent/10">{t('characterForm.aiHint')}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div><label className={lc}>{t('characterForm.name')} <span className="text-red-400">*</span></label><input value={playerConfig.name} onChange={e => updatePlayer('name', e.target.value)} className={ic} /></div>
                <div><label className={lc}>{t('characterForm.nickname')}</label><input value={playerConfig.nickname || ''} onChange={e => updatePlayer('nickname', e.target.value)} className={ic} /></div>
                <div><label className={lc}>{t('characterForm.gender')} <span className="text-red-400">*</span></label><input value={playerConfig.gender} onChange={e => updatePlayer('gender', e.target.value)} className={ic} /></div>
              </div>
              <div><label className={lc}>{t('characterForm.age')} <span className="text-red-400">*</span></label><input type="number" value={playerConfig.age || ''} onChange={e => updatePlayer('age', parseInt(e.target.value) || 0)} className={ic} min="0" /></div>
              <div><label className={lc}>{t('characterForm.appearance')}</label><textarea value={playerConfig.appearance} onChange={e => updatePlayer('appearance', e.target.value)} className={tc} /></div>
              <div><label className={lc}>{t('characterForm.personality')}</label><textarea value={playerConfig.personality} onChange={e => updatePlayer('personality', e.target.value)} className={tc} /></div>
              <div><label className={lc}>{t('characterForm.extraPrompt')}</label><textarea value={playerConfig.extraPrompt} onChange={e => updatePlayer('extraPrompt', e.target.value)} className={tc} /></div>
            </div>
          </section>

          {/* Character Templates */}
          {globalChars.length > 0 && (
            <section className="bg-game-panel/60 rounded-2xl border border-white/[0.07] p-6">
              <h2 className="text-lg font-semibold mb-5 text-game-highlight">{t('worldCreate.selectChars')}</h2>
              <p className="text-sm text-game-muted mb-4">{t('worldCreate.selectCharsHint')}</p>
              <div className="grid grid-cols-2 gap-3">
                {globalChars.map(char => {
                  const selected = selectedGlobalIds.has(char.id)
                  return (
                    <div key={char.id} onClick={() => toggleGlobalChar(char)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${selected ? 'border-indigo-500/50 bg-indigo-500/[0.08]' : 'border-white/[0.07] hover:border-indigo-500/30 bg-white/[0.02]'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-game-text">{char.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${selected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/[0.05] text-game-muted'}`}>{selected ? t('worldCreate.selectedChars') : '+'}</span>
                      </div>
                      <p className="text-xs text-game-muted mt-1">{char.gender} {char.age ? char.age + t('characterForm.ageUnit') : ''}</p>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Important Characters */}
          <section className="bg-game-panel/60 rounded-2xl border border-white/[0.07] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-game-highlight">{t('worldCreate.importantChars')}</h2>
              <button onClick={() => setShowCharModal(true)} className="px-4 py-2 rounded-xl border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/[0.06] hover:border-indigo-500/40 transition-all text-sm">+ {t('worldCreate.addChar')}</button>
            </div>
            {importantChars.length === 0 && <p className="text-sm text-game-muted py-4">{t('worldCreate.noCharsYet')}</p>}
            {importantChars.map((char, i) => (
              <div key={i} className="mt-3 p-4 rounded-xl border border-white/[0.10] relative bg-white/[0.02] flex items-center justify-between">
                <div><span className="font-medium text-game-text">{char.name || t('worldCreate.unnamedChar')}</span><span className="text-xs text-game-muted ml-2">{char.gender} {char.age}</span></div>
                <button onClick={() => removeImportantChar(i)} className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/60 hover:text-red-300 hover:bg-red-500/10 transition-all">{t('common.delete')}</button>
              </div>
            ))}
          </section>

          <button onClick={handleCreate} disabled={creating}
            className="w-full btn-primary py-3.5 rounded-xl font-semibold text-base text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-all">
            {creating ? t('worldCreate.creating') : t('worldCreate.createBtn')}
          </button>
        </div>
      </main>
      {showCharModal && <CharacterFormModal mode="create" onSave={handleSaveChar} onClose={() => setShowCharModal(false)} />}
    </div>
  )
}
