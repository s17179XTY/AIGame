import React, { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { useI18n } from '../i18n'
import { useToast } from '../components/ToastProvider'
import WorldSettingsModal from '../components/WorldSettingsModal'
import CharacterFormModal from '../components/CharacterFormModal'
import type { World, Character, CharacterConfig } from '../../../main/services/types'

export default function HomePage() {
  const { t } = useI18n()
  const toast = useToast()
  const [worlds, setWorlds] = useState<World[]>([])
  const [showSettingsWorldId, setShowSettingsWorldId] = useState<string | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [showCharForm, setShowCharForm] = useState(false)
  const [editingChar, setEditingChar] = useState<Character | null>(null)
  const [charForm, setCharForm] = useState<CharacterConfig>({
    name: '',
    nickname: '',
    gender: '',
    age: 0,
    appearance: '',
    personality: '',
    extraPrompt: '',
  })
  const setPage = useAppStore((s) => s.setPage)
  const selectWorld = useAppStore((s) => s.selectWorld)

  useEffect(() => {
    window.api.world.list().then(setWorlds)
    window.api.character.listGlobal().then(setCharacters)
  }, [])

  const refreshWorlds = async () => {
    const list = await window.api.world.list()
    setWorlds(list)
  }

  const refreshChars = async () => {
    const list = await window.api.character.listGlobal()
    setCharacters(list)
  }


  const handleCreateChar = async () => {
    if (!charForm.name.trim()) {
      toast.show('請填寫角色名稱')
      return
    }
    try {
      await window.api.character.create('__global__', charForm, false, false)
      await refreshChars()
      setShowCharForm(false)
      setCharForm({ name: '', nickname: '', gender: '', age: 0, appearance: '', personality: '', extraPrompt: '' })
    } catch (err: any) {
      toast.show('建立失敗: ' + (err.message ?? '未知錯誤'))
    }
  }

  const handleUpdateChar = async () => {
    if (!editingChar) return
    try {
      await window.api.character.update(editingChar.id, charForm)
      await refreshChars()
      setEditingChar(null)
      setCharForm({ name: '', nickname: '', gender: '', age: 0, appearance: '', personality: '', extraPrompt: '' })
    } catch (err: any) {
      toast.show('更新失敗: ' + (err.message ?? '未知錯誤'))
    }
  }

  const handleDeleteChar = async (id: string) => {
    if (!confirm('確定要刪除此角色嗎？')) return
    try {
      await window.api.character.delete(id)
      await refreshChars()
    } catch (err: any) {
      toast.show('刪除失敗: ' + (err.message ?? '未知錯誤'))
    }
  }

  const openEditChar = (char: Character) => {
    setEditingChar(char)
    setCharForm({
      name: char.name,
      nickname: char.nickname || '',
      gender: char.gender,
      age: char.age,
      appearance: char.appearance,
      personality: char.personality,
      extraPrompt: char.extraPrompt,
    })
  }
  const handleEnterWorld = async (world: World) => {
    selectWorld(world.id)
    setPage('game')
  }

  const handleDeleteWorld = async (id: string, name: string) => {
    if (!confirm(`確定要刪除世界「${name}」嗎？此操作無法復原。`)) return
    await window.api.world.delete(id)
    setWorlds((w) => w.filter((x) => x.id !== id))
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-game-bg to-game-panel/30">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">
            ?
          </div>
          <h1 className="text-xl font-bold">
            <span className="gradient-text">{t('app.title')}</span>
          </h1>
        </div>
        <button
          onClick={() => setPage('settings')}
          className="px-4 py-2 text-sm rounded-xl border border-white/[0.10] text-game-muted hover:border-indigo-500/40 hover:text-indigo-300 hover:bg-white/[0.03] transition-all duration-200"
        >
          設定
        </button>
      </header>

      {/* World List */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-game-text">你的世界</h2>
              <p className="text-sm text-game-muted mt-1">選擇一個世界，開始你的冒險</p>
            </div>
            <button
              onClick={() => setPage('world-create')}
              className="btn-primary px-5 py-2.5 rounded-xl font-medium text-sm text-white shadow-lg shadow-indigo-500/25"
            >
              + 建立新世界
            </button>
          </div>

          {worlds.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-6 opacity-30">??</div>
              <p className="text-lg text-game-muted mb-2">尚無任何世界</p>
              <p className="text-sm text-game-muted/60">點擊上方按鈕建立你的第一個世界，開始冒險！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {worlds.map((world) => (
                <div
                  key={world.id}
                  className="group flex items-center justify-between p-5 rounded-2xl bg-game-panel/60 border border-white/[0.07] hover:border-indigo-500/30 hover:bg-game-panel/90 transition-all duration-200 cursor-pointer backdrop-blur-sm"
                  onClick={() => handleEnterWorld(world)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 flex items-center justify-center text-xl shrink-0 ring-1 ring-white/[0.07]">
                      ??
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate text-game-text">{world.name}</h3>
                      <p className="text-sm text-game-muted truncate mt-0.5">
                        {world.config.worldview.slice(0, 80)}{world.config.worldview.length > 80 ? '...' : ''}
                      </p>
                      <p className="text-xs text-game-muted/50 mt-1.5">
                        最後更新: {new Date(world.updatedAt).toLocaleString('zh-TW')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowSettingsWorldId(world.id)
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg border border-white/[0.10] text-game-muted hover:text-indigo-300 hover:border-indigo-500/40 hover:bg-white/[0.03] transition-all duration-200"
                      title="設定"
                    >
                      {'??'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteWorld(world.id, world.name)
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg border border-red-400/20 text-red-400/80 hover:bg-red-500/10 hover:border-red-400/40 transition-all duration-200"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Character Templates */}
        <div className="max-w-3xl mx-auto mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-game-text">角色模板</h2>
              <p className="text-sm text-game-muted mt-1">建立角色模板，在創造世界時可直接選取加入</p>
            </div>
            <button
              onClick={() => { setShowCharForm(true); setEditingChar(null); setCharForm({ name: '', nickname: '', gender: '', age: 0, appearance: '', personality: '', extraPrompt: '' }) }}
              className="px-4 py-2 rounded-xl border border-game-highlight/30 text-game-highlight text-sm hover:bg-game-highlight/10 transition-colors"
            >
              + 新增角色
            </button>
          </div>

          {characters.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 opacity-30">??</div>
              <p className="text-sm text-game-muted">尚無角色模板</p>
              <p className="text-xs text-game-muted/60 mt-1">點擊上方按鈕建立角色，在創建世界時可直接選取</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-game-panel/40 border border-white/[0.06] hover:border-game-highlight/20 transition-all duration-200 cursor-pointer"
                  onClick={() => openEditChar(char)}
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 flex items-center justify-center text-lg shrink-0 ring-1 ring-white/[0.07]">
                    {char.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-game-text">{char.name}</span>
                      {char.nickname && <span className="text-xs text-game-muted/70">({char.nickname})</span>}
                    </div>
                    <p className="text-xs text-game-muted">{char.gender} · {char.age}歲</p>
                    <p className="text-xs text-game-muted/60 truncate">{char.personality.slice(0, 50)}{char.personality.length > 50 ? '...' : ''}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteChar(char.id) }}
                    className="px-2 py-1 text-xs border border-red-400/20 rounded-lg text-red-400/70 hover:bg-red-500/10 hover:border-red-400/40 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    刪除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>


      {/* Character Form Modal */}
      {(showCharForm || editingChar) && (
        <CharacterFormModal
          mode={editingChar ? 'edit' : 'create'}
          character={editingChar || undefined}
          onSave={async (config) => {
            if (editingChar) {
              await window.api.character.update(editingChar.id, config)
            } else {
              await window.api.character.create('__global__', config, false, false)
            }
            await refreshChars()
          }}
          onClose={() => { setShowCharForm(false); setEditingChar(null); setCharForm({ name: '', nickname: '', gender: '', age: 0, appearance: '', personality: '', extraPrompt: '' }) }}
        />
      )}

      {showSettingsWorldId && (
        <WorldSettingsModal
          worldId={showSettingsWorldId}
          onClose={() => setShowSettingsWorldId(null)}
          onWorldUpdated={() => { refreshWorlds() }}
        />
      )}
    </div>
  )
}
