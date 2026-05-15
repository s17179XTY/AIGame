import React, { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { useI18n } from '../i18n'
import { useToast } from '../components/ToastProvider'
import type { World, Character } from '../../../main/services/types'
import CharacterFormModal, { CharacterFormData } from '../components/CharacterFormModal'

export default function HomePage() {
  const { t } = useI18n()
  const toast = useToast()
  const [worlds, setWorlds] = useState<World[]>([])
  const [globalChars, setGlobalChars] = useState<Character[]>([])
  const [showCharForm, setShowCharForm] = useState(false)
  const [editChar, setEditChar] = useState<Character | null>(null)
  const setPage = useAppStore((s) => s.setPage)
  const selectWorld = useAppStore((s) => s.selectWorld)

  useEffect(() => { window.api.world.list().then(setWorlds); loadGlobalChars() }, [])

  const loadGlobalChars = async () => {
    const chars = await window.api.character.listGlobal()
    setGlobalChars(chars || [])
  }

  const handleEnterWorld = async (world: World) => { selectWorld(world.id); setPage('game') }

  const handleDeleteWorld = async (id: string, name: string) => {
    if (!confirm(t('home.confirmDelete'))) return
    await window.api.world.delete(id)
    setWorlds(w => w.filter(x => x.id !== id))
  }

  const handleCreateChar = async (data: CharacterFormData) => {
    try {
      await window.api.character.create('__global__', data)
      setShowCharForm(false)
      loadGlobalChars()
    } catch (err: any) { toast.show(t('common.error') + ': ' + (err.message || '')) }
  }

  const handleUpdateChar = async (data: CharacterFormData) => {
    if (!editChar) return
    try {
      await window.api.character.update(editChar.id, data)
      setEditChar(null)
      setShowCharForm(false)
      loadGlobalChars()
    } catch (err: any) { toast.show(t('common.error') + ': ' + (err.message || '')) }
  }

  const handleDeleteChar = async (id: string) => {
    if (!confirm(t('home.confirmDelete'))) return
    try {
      await window.api.character.delete(id)
      loadGlobalChars()
    } catch (err: any) { toast.show(t('common.error') + ': ' + (err.message || '')) }
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-game-bg to-game-panel/30">
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">✦</div>
          <h1 className="text-xl font-bold"><span className="gradient-text">{t('app.title')}</span></h1>
        </div>
        <button onClick={() => setPage('settings')} className="px-4 py-2 text-sm rounded-xl border border-white/[0.10] text-game-muted hover:border-indigo-500/40 hover:text-indigo-300 hover:bg-white/[0.03] transition-all">{t('settings.title')}</button>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-10">

          {/* World List */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-2xl font-bold text-game-text">{t('home.title')}</h2><p className="text-sm text-game-muted mt-1">{t('home.noWorldsHint')}</p></div>
              <button onClick={() => setPage('world-create')} className="btn-primary px-5 py-2.5 rounded-xl font-medium text-sm text-white shadow-lg shadow-indigo-500/25">+ {t('home.createWorld')}</button>
            </div>
            {worlds.length === 0 ? (
              <div className="text-center py-20"><div className="text-6xl mb-4 opacity-30">...</div><p className="text-lg text-game-muted mb-2">{t('home.noWorlds')}</p><p className="text-sm text-game-muted/60">{t('home.noWorldsHint')}</p></div>
            ) : (
              <div className="space-y-3">
                {worlds.map(world => (
                  <div key={world.id} className="group flex items-center justify-between p-5 rounded-2xl bg-game-panel/60 border border-white/[0.07] hover:border-indigo-500/30 hover:bg-game-panel/90 transition-all cursor-pointer" onClick={() => handleEnterWorld(world)}>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 flex items-center justify-center text-xl shrink-0 ring-1 ring-white/[0.07]">🌍</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate text-game-text">{world.name}</h3>
                        <p className="text-sm text-game-muted truncate mt-0.5">{world.config.worldview.slice(0, 80)}{world.config.worldview.length > 80 ? '...' : ''}</p>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDeleteWorld(world.id, world.name) }} className="ml-4 px-3 py-1.5 text-xs rounded-lg border border-red-400/20 text-red-400/80 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all">{t('common.delete')}</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Character Templates */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-2xl font-bold text-game-text">{t('home.characters')}</h2><p className="text-sm text-game-muted mt-1">{t('home.noCharactersHint')}</p></div>
              <button onClick={() => { setEditChar(null); setShowCharForm(true) }} className="btn-primary px-5 py-2.5 rounded-xl font-medium text-sm text-white shadow-lg shadow-indigo-500/25">+ {t('home.addCharacter')}</button>
            </div>
            {globalChars.length === 0 ? (
              <div className="text-center py-16"><p className="text-game-muted">{t('home.noCharacters')}</p><p className="text-sm text-game-muted/60 mt-1">{t('home.noCharactersHint')}</p></div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {globalChars.map(char => (
                  <div key={char.id} className="p-4 rounded-xl border border-white/[0.07] bg-game-panel/40 hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-game-text">{char.name}</span>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditChar(char); setShowCharForm(true) }} className="px-2 py-0.5 text-xs rounded border border-game-accent/20 text-game-muted hover:text-game-text transition-all">{t('common.edit')}</button>
                        <button onClick={() => handleDeleteChar(char.id)} className="px-2 py-0.5 text-xs rounded border border-red-400/20 text-red-400/70 hover:text-red-300 transition-all">{t('common.delete')}</button>
                      </div>
                    </div>
                    <p className="text-xs text-game-muted">{char.gender} {char.age}{t('characterForm.ageUnit')}</p>
                    {char.personality && <p className="text-xs text-game-muted/70 mt-1 line-clamp-2">{char.personality.slice(0, 60)}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      {showCharForm && (
        <CharacterFormModal
          mode={editChar ? 'edit' : 'create'}
          character={editChar}
          onSave={editChar ? handleUpdateChar : handleCreateChar}
          onClose={() => { setShowCharForm(false); setEditChar(null) }}
        />
      )}
    </div>
  )
}
