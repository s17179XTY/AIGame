import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useGameStore } from '../stores/gameStore'
import { useI18n } from '../i18n'
import { useToast } from '../components/ToastProvider'
import type { World, WorldState, Character, StoryEntry, NewCharacterRequest } from '../../../main/services/types'
import WorldSettingsModal from '../components/WorldSettingsModal'
import CharacterCardPopover from '../components/CharacterCardPopover'
import GMPanel from '../components/GMPanel'

export default function GamePage() {
  const { t } = useI18n()
  const toast = useToast()
  const setPage = useAppStore((s) => s.setPage)
  const worldId = useAppStore((s) => s.selectedWorldId)
  const settings = useSettingsStore((s) => s.settings)
  const store = useGameStore()

  const [world, setWorld] = useState<World | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [playerInput, setPlayerInput] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [pendingChars, setPendingChars] = useState<NewCharacterRequest[]>([])
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const hasImageConfig = (settings.activeImageConfigId ?? null) !== null
  const hasVoiceConfig = (settings.activeVoiceConfigId ?? null) !== null

  const [showWorldSettings, setShowWorldSettings] = useState(false)
  const [selectedCharCard, setSelectedCharCard] = useState<{ char: Character; emotion?: string } | null>(null)
  const [charCardPos, setCharCardPos] = useState({ x: 0, y: 0 })
  const [showGMPanel, setShowGMPanel] = useState(false)
  const [gameMode, setGameMode] = useState<'dialogue' | 'free'>('dialogue')

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!worldId) { setPage('home'); return }
    const loadGame = async () => {
      store.clear()
      const w = await window.api.world.get(worldId)
      if (!w) { setPage('home'); return }
      setWorld(w)
      const chars = await window.api.character.list(worldId)
      setCharacters(chars)
      const state = await window.api.world.getState(worldId)
      store.setWorldState(state)
      const log = await window.api.story.getLog(worldId)
      store.addEntries(log)
      setLoaded(true)
    }
    loadGame()
  }, [worldId])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [store.entries])
  useEffect(() => { if (loaded) { setTimeout(() => inputRef.current?.focus(), 100) } }, [loaded])

  const autoPlayDialogues = useCallback(async (entries: StoryEntry[]) => {
    if (!settings.autoPlayVoice || !hasVoiceConfig) return
    const npcDialogues = entries.filter((e) => e.type === 'dialogue' && !characters.find((c) => c.id === e.speakerId)?.isPlayer)
    for (const entry of npcDialogues) {
      try {
        const result = await window.api.voice.tts(entry.content)
        const audio = new Audio('file://' + result.audioPath)
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve()
          audio.onerror = () => resolve()
          audio.play()
        })
      } catch { /* skip */ }
    }
  }, [settings.autoPlayVoice, hasVoiceConfig, characters])

  const handleSend = useCallback(async () => {
    const input = playerInput.trim()
    if (!input || store.isProcessing || !worldId) return
    setPlayerInput('')
    store.setProcessing(true)
    try {
      const response = await window.api.game.sendAction({ worldId, playerInput: input, actionType: gameMode === 'free' ? 'free-action' : 'dialogue' })
      store.addEntries(response.entries)
      const state = await window.api.world.getState(worldId)
      store.setWorldState(state)
      if (response.newCharacterRequests && response.newCharacterRequests.length > 0) {
        setPendingChars(response.newCharacterRequests)
      }
      if (response.imageTrigger?.shouldGenerate && hasImageConfig) {
        store.setGeneratingImage(true)
        try {
          const result = await window.api.image.generateScene(response.imageTrigger.sceneDescription)
          store.setCurrentImagePath(result.imagePath)
        } catch { /* silent */ }
        finally { store.setGeneratingImage(false) }
      }
      autoPlayDialogues(response.entries)
    } catch (err: any) {
      toast.show(t('game.aiError') + ': ' + (err.message ?? t('common.unknownError')))
    } finally {
      store.setProcessing(false)
      inputRef.current?.focus()
    }
  }, [playerInput, store, worldId, settings, hasImageConfig, gameMode, toast, t, autoPlayDialogues])

  const handleConfirmNewCharacter = async (char: NewCharacterRequest, index: number) => {
    try {
      await window.api.character.create(worldId!, { name: char.name, gender: char.gender, age: char.age, appearance: char.appearance, personality: char.personality, extraPrompt: '' }, false, true)
      const chars = await window.api.character.list(worldId!)
      setCharacters(chars)
      setPendingChars((prev) => prev.filter((_, i) => i !== index))
    } catch (err: any) {
      toast.show(t('game.newCharFailed') + ': ' + (err.message ?? t('common.unknownError')))
    }
  }

  const handleSkipNewCharacter = (index: number) => {
    setPendingChars((prev) => prev.filter((_, i) => i !== index))
  }

  const handleManualImageGen = async () => {
    if (!hasImageConfig) return
    store.setGeneratingImage(true)
    try {
      const state = store.worldState
      const prompt = 'Scene illustration: ' + (state?.scene ?? world?.config.initialScene ?? '') + '. Fantasy art style, digital painting.'
      const result = await window.api.image.generateScene(prompt)
      store.setCurrentImagePath(result.imagePath)
    } catch { /* silent */ }
    finally { store.setGeneratingImage(false) }
  }

  const handleTtsPlay = async (text: string, entryId: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (playingAudioId === entryId) { setPlayingAudioId(null); return }
    try {
      const result = await window.api.voice.tts(text)
      const audio = new Audio('file://' + result.audioPath)
      audioRef.current = audio
      setPlayingAudioId(entryId)
      audio.onended = () => { setPlayingAudioId(null); audioRef.current = null }
      audio.onerror = () => { setPlayingAudioId(null); audioRef.current = null }
      await audio.play()
    } catch { setPlayingAudioId(null) }
  }

  const handleDeleteEntry = async (entryId: string) => {
    const ok = await toast.confirm(t('game.delConfirm'))
    if (!ok) return
    try {
      await window.api.story.deleteEntry(entryId)
      if (worldId) { store.clear(); const log = await window.api.story.getLog(worldId); store.addEntries(log) }
    } catch {}
  }

  const handleRollback = async (sequence: number) => {
    const ok = await toast.confirm(t('game.rollbackConfirm'))
    if (!ok) return
    try {
      if (worldId) { await window.api.story.deleteAfter(worldId, sequence); store.clear(); const log = await window.api.story.getLog(worldId); store.addEntries(log) }
    } catch {}
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!loaded || !world) {
    return <div className="h-screen flex items-center justify-center bg-game-bg"><div className="text-center"><div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20"><span className="generating-pulse">{'\u2726'}</span></div><p className="text-game-muted text-base">{t('common.loading')}</p></div></div>
  }

  return (
    <div className="h-screen flex flex-col bg-game-bg relative">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.07] shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setPage('home')} className="text-game-muted hover:text-game-text text-sm">{'\u2190'} {t('common.back')}</button>
          <h1 className="text-sm font-semibold text-game-text truncate max-w-[200px]">{world.name}</h1>
          <button onClick={() => setPage('story-log')} className="text-xs text-game-muted hover:text-game-highlight">{t('storyLog.title')}</button>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-play voice toggle */}
          {hasVoiceConfig && (
            <button
              onClick={() => updateSettings({ autoPlayVoice: !settings.autoPlayVoice })}
              className={'w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ' + (settings.autoPlayVoice ? 'bg-game-highlight/20 text-game-highlight' : 'bg-game-panel/80 text-game-muted hover:text-game-text')}
              title={settings.autoPlayVoice ? t('game.stopRead') : t('game.readAloud')}
            >
              {'\uD83D\uDD0A'}
            </button>
          )}
          {/* Mode toggle */}
          <button
            onClick={() => setGameMode((m) => (m === 'dialogue' ? 'free' : 'dialogue'))}
            className={'px-3 py-1.5 text-xs rounded-xl border transition-colors ' + (gameMode === 'free' ? 'border-game-highlight/50 bg-game-highlight/10 text-game-highlight' : 'border-white/[0.07] bg-game-panel/80 text-game-muted hover:border-game-highlight/30')}
          >
            {gameMode === 'free' ? t('game.free') : t('game.talk')}
          </button>
          {/* GM Panel toggle */}
          <button onClick={() => setShowGMPanel((s) => !s)}
            className="w-8 h-8 rounded-lg bg-game-panel/80 border border-white/[0.07] flex items-center justify-center text-sm text-game-muted hover:text-game-text hover:border-game-highlight/30 transition-colors"
            title={t('game.gmPanel')}
          >
            {'\uD83C\uDFAD'}
          </button>
          {/* World Settings */}
          <button onClick={() => setShowWorldSettings(true)}
            className="w-8 h-8 rounded-lg bg-game-panel/80 border border-white/[0.07] flex items-center justify-center text-sm text-game-muted hover:text-game-text hover:border-game-highlight/30 transition-colors"
            title={t('game.worldSettings')}
          >
            {'\u2699\uFE0F'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {store.entries.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-game-muted text-sm">{world.config.initialScene || 'The story begins...'}</p>
              </div>
            )}
            {store.entries.map((entry) => (
              <ChatBubble
                key={entry.id}
                entry={entry}
                characters={characters}
                hasImage={!!entry.imagePath}
                hasVoice={hasVoiceConfig}
                playingId={playingAudioId}
                onTtsPlay={handleTtsPlay}
                onDeleteEntry={handleDeleteEntry}
                onRollback={handleRollback}
                onAvatarClick={(entry, chars, pos) => {
                  const char = chars.find((c) => c.id === entry.speakerId)
                  if (char) { setSelectedCharCard({ char, emotion: entry.emotion }); setCharCardPos(pos) }
                }}
              />
            ))}
            {store.isProcessing && (
              <div className="chat-bubble-enter flex justify-center">
                <div className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <p className="text-sm text-game-muted">{t('game.processing')}</p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* New character requests */}
          {pendingChars.length > 0 && (
            <div className="px-4 py-3 border-t border-white/[0.07] bg-game-panel/60">
              <p className="text-xs text-game-highlight mb-2">{t('game.newCharRequest')}:</p>
              <div className="flex flex-wrap gap-2">
                {pendingChars.map((char, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.07]">
                    <span className="text-xs text-game-text">{char.name} ({char.gender}, {char.age}y)</span>
                    <button onClick={() => handleConfirmNewCharacter(char, i)} className="text-xs text-green-400 hover:text-green-300">{t('game.confirmChar')}</button>
                    <button onClick={() => handleSkipNewCharacter(i)} className="text-xs text-game-muted hover:text-game-text">{t('game.skipChar')}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/[0.07]">
            <div className="flex gap-3">
              <button onClick={handleManualImageGen} disabled={!hasImageConfig}
                className="w-10 h-10 rounded-xl bg-game-panel/80 border border-white/[0.07] flex items-center justify-center text-game-muted hover:text-game-text hover:border-game-highlight/30 disabled:opacity-30 transition-colors shrink-0"
                title="Generate scene">
                {'\uD83C\uDFB2'}
              </button>
              <textarea
                ref={inputRef}
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={gameMode === 'free' ? t('game.freePlaceholder') : t('game.inputPlaceholder')}
                disabled={store.isProcessing}
                rows={2}
                className="flex-1 bg-game-bg border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-game-text placeholder-game-muted/40 focus:border-game-highlight/30 outline-none resize-none disabled:opacity-50"
              />
              <button onClick={handleSend} disabled={store.isProcessing || !playerInput.trim()}
                className="px-5 py-2.5 bg-game-highlight rounded-xl text-sm font-medium hover:bg-game-highlight/80 disabled:opacity-40 transition-colors shrink-0 self-end">
                {t('game.send')}
              </button>
            </div>
          </div>
        </div>

        {/* GM Panel */}
        {showGMPanel && worldId && <GMPanel worldId={worldId} onClose={() => setShowGMPanel(false)} />}

        {/* Right: Scene Panel */}
        {hasImageConfig && (
          <div className="w-80 shrink-0 border-l border-white/[0.07] bg-game-panel/30 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
              {store.isGeneratingImage ? (
                <div className="text-center text-game-muted"><div className="text-5xl mb-4 generating-pulse">{'\uD83C\uDFA8'}</div><p className="text-sm">{t('game.drawing')}</p></div>
              ) : store.currentImagePath ? (
                <img src={'file://' + store.currentImagePath} alt="Scene" className="max-w-full max-h-full rounded-2xl scene-image-enter object-contain shadow-2xl" />
              ) : (
                <div className="text-center text-game-muted/30"><p className="text-5xl mb-4">{'\uD83D\uDDBC\uFE0F'}</p><p className="text-sm">{t('game.noScene')}</p><p className="text-xs mt-1">{t('game.generateScene')}</p></div>
              )}
            </div>
            {store.worldState && (
              <div className="p-4 border-t border-white/[0.07] bg-game-panel/60 backdrop-blur-sm">
                <p className="font-semibold text-game-text mb-2">{store.worldState.scene}</p>
                <div className="flex items-center gap-3 text-xs text-game-muted">
                  <span>{'\uD83D\uDD50'} {store.worldState.time}</span>
                  <span>{'\uD83C\uDF24'} {store.worldState.weather}</span>
                </div>
                {characters.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.07]">
                    <p className="text-xs text-game-muted/60 mb-1.5">{t('game.sceneCharacters')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {characters.slice(0, 8).map((c) => (
                        <span key={c.id} className="inline-block px-2 py-0.5 text-xs rounded-md bg-white/[0.05] border border-white/[0.07] text-game-muted">{c.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showWorldSettings && worldId && (
        <WorldSettingsModal worldId={worldId} onClose={() => { setShowWorldSettings(false); window.api.world.get(worldId).then(setWorld); window.api.character.list(worldId).then(setCharacters) }} onWorldUpdated={(w) => setWorld(w)} />
      )}
      {selectedCharCard && (
        <CharacterCardPopover character={selectedCharCard.char} emotion={selectedCharCard.emotion} position={charCardPos} onClose={() => setSelectedCharCard(null)} />
      )}
    </div>
  )
}

function ChatBubble({
  entry, characters, hasVoice, playingId, onTtsPlay, onAvatarClick, onDeleteEntry, onRollback,
}: {
  entry: StoryEntry
  characters: Character[]
  hasImage: boolean
  hasVoice?: boolean
  playingId?: string | null
  onTtsPlay?: (text: string, id: string) => void
  onAvatarClick?: (entry: StoryEntry, characters: Character[], pos: { x: number; y: number }) => void
  onDeleteEntry?: (id: string) => void
  onRollback?: (sequence: number) => void
}) {
  const character = characters.find((c) => c.id === entry.speakerId)
  const isNarration = entry.type === 'narration'
  const isAction = entry.type === 'action'
  const isPlayer = character?.isPlayer

  if (isNarration) {
    return (
      <div className="chat-bubble-enter flex justify-center group">
        <div className="max-w-xl px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-center relative">
          <p className="text-sm text-game-muted italic leading-relaxed">{entry.content}</p>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDeleteEntry && <button onClick={() => onDeleteEntry(entry.id)} className="text-xs text-red-400/50 hover:text-red-400">{'\u2715'}</button>}
            {onRollback && <button onClick={() => onRollback(entry.sequence)} className="text-xs text-game-muted/50 hover:text-game-muted">{'\u21A9'}</button>}
          </div>
        </div>
      </div>
    )
  }

  if (isAction) {
    return (
      <div className="chat-bubble-enter flex justify-center group">
        <p className="text-sm text-game-muted"><span className="font-semibold text-game-text">{entry.speakerName}</span> {entry.content}</p>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          {onDeleteEntry && <button onClick={() => onDeleteEntry(entry.id)} className="text-xs text-red-400/50 hover:text-red-400">{'\u2715'}</button>}
          {onRollback && <button onClick={() => onRollback(entry.sequence)} className="text-xs text-game-muted/50 hover:text-game-muted">{'\u21A9'}</button>}
        </div>
      </div>
    )
  }

  return (
    <div className={'chat-bubble-enter flex ' + (isPlayer ? 'justify-end' : 'justify-start')}>
      <div className={'flex gap-2.5 max-w-[70%] ' + (isPlayer ? 'flex-row-reverse' : '')}>
        <button
          onClick={(e) => { const rect = (e.target as HTMLElement).getBoundingClientRect(); onAvatarClick?.(entry, characters, { x: rect.left, y: rect.bottom + 8 }) }}
          className={'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-lg ' + (isPlayer ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/25' : 'bg-game-panel text-game-muted ring-1 ring-white/[0.10]')}>
          {entry.speakerName.charAt(0)}
        </button>
        <div className={'min-w-0 ' + (isPlayer ? 'items-end' : '')}>
          <div className={'flex items-center gap-2 mb-1 ' + (isPlayer ? 'justify-end' : '')}>
            <span className="text-xs text-game-muted">{entry.speakerName}</span>
            {entry.emotion && <span className="text-xs text-game-muted/50">({entry.emotion})</span>}
            {!isPlayer && hasVoice && onTtsPlay && (
              <button onClick={() => onTtsPlay(entry.content, entry.id)}
                className="text-xs text-game-muted/50 hover:text-game-highlight transition-colors"
                title={playingId === entry.id ? 'Stop' : 'Read aloud'}>
                {playingId === entry.id ? '\u23F9' : '\uD83D\uDD0A'}
              </button>
            )}
          </div>
          <div className={'px-4 py-2.5 rounded-2xl text-sm leading-relaxed ' + (isPlayer ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-md shadow-lg shadow-indigo-500/20' : 'bg-game-panel/80 text-game-text rounded-tl-md border border-white/[0.07]')}>
            <p>{entry.content}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function updateSettings(_updates: any) {
  const { useSettingsStore } = require('../stores/settingsStore')
  useSettingsStore.getState().updateSettings(_updates)
}