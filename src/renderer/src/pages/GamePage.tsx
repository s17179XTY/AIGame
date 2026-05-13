import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useGameStore } from '../stores/gameStore'
import type {
  World,
  WorldState,
  Character,
  StoryEntry,
  NewCharacterRequest,
} from '../../../main/services/types'

export default function GamePage() {
  const setPage = useAppStore((s) => s.setPage)
  const worldId = useAppStore((s) => s.selectedWorldId)
  const settings = useSettingsStore((s) => s.settings)
  const store = useGameStore()

  const [world, setWorld] = useState<World | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [playerInput, setPlayerInput] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [pendingChars, setPendingChars] = useState<NewCharacterRequest[]>([])

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load initial data
  useEffect(() => {
    if (!worldId) {
      setPage('home')
      return
    }

    const loadGame = async () => {
      store.clear()
      const w = await window.api.world.get(worldId)
      if (!w) {
        setPage('home')
        return
      }
      setWorld(w)

      const chars = await window.api.character.list(worldId)
      setCharacters(chars)

      const state = await window.api.world.getState(worldId)
      store.setWorldState(state)

      // Load existing story log
      const log = await window.api.story.getLog(worldId)
      store.addEntries(log)

      setLoaded(true)
    }

    loadGame()
  }, [worldId])

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [store.entries])

  // Focus input
  useEffect(() => {
    if (loaded) inputRef.current?.focus()
  }, [loaded])

  const handleSend = useCallback(async () => {
    const input = playerInput.trim()
    if (!input || store.isProcessing || !worldId) return

    setPlayerInput('')
    store.setProcessing(true)

    try {
      const response = await window.api.game.sendAction({
        worldId,
        playerInput: input,
      })

      store.addEntries(response.entries)

      // Update world state
      const state = await window.api.world.getState(worldId)
      store.setWorldState(state)

      // Handle new character requests
      if (response.newCharacterRequests && response.newCharacterRequests.length > 0) {
        setPendingChars(response.newCharacterRequests)
      }

      // Handle image trigger
      if (response.imageTrigger?.shouldGenerate && settings.imageProvider !== 'none') {
        store.setGeneratingImage(true)
        try {
          const result = await window.api.image.generateScene(
            response.imageTrigger.sceneDescription
          )
          store.setCurrentImagePath(result.imagePath)
        } catch {
          // Image generation failed silently
        } finally {
          store.setGeneratingImage(false)
        }
      }
    } catch (err: any) {
      alert('AI 回應失敗: ' + (err.message ?? '未知錯誤'))
    } finally {
      store.setProcessing(false)
      inputRef.current?.focus()
    }
  }, [playerInput, store, worldId, settings])

  const handleConfirmNewCharacter = async (char: NewCharacterRequest, index: number) => {
    try {
      await window.api.character.create(worldId!, {
        name: char.name,
        gender: char.gender,
        age: char.age,
        appearance: char.appearance,
        personality: char.personality,
        extraPrompt: '',
      }, false, true)

      // Refresh character list
      const chars = await window.api.character.list(worldId!)
      setCharacters(chars)

      setPendingChars((prev) => prev.filter((_, i) => i !== index))
    } catch (err: any) {
      alert('新增角色失敗: ' + (err.message ?? '未知錯誤'))
    }
  }

  const handleSkipNewCharacter = (index: number) => {
    setPendingChars((prev) => prev.filter((_, i) => i !== index))
  }

  const handleManualImageGen = async () => {
    if (settings.imageProvider === 'none') return
    store.setGeneratingImage(true)
    try {
      const state = store.worldState
      const prompt = `Scene illustration: ${state?.scene ?? world?.config.initialScene ?? ''}. Fantasy art style, digital painting.`
      const result = await window.api.image.generateScene(prompt)
      store.setCurrentImagePath(result.imagePath)
    } catch {
      // Failed silently
    } finally {
      store.setGeneratingImage(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!loaded || !world) {
    return (
      <div className="h-screen flex items-center justify-center bg-game-bg">
        <div className="text-center">
          <div className="text-4xl mb-4 generating-pulse">✦</div>
          <p className="text-game-muted text-lg">載入中...</p>
        </div>
      </div>
    )
  }

  const player = characters.find((c) => c.isPlayer)

  return (
    <div className="h-screen flex flex-col bg-game-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.06] bg-game-bg/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage('home')}
            className="flex items-center gap-1.5 text-game-muted hover:text-game-text transition-colors text-sm"
          >
            ← 返回
          </button>
          <span className="text-white/[0.15]">|</span>
          <h1 className="font-semibold text-game-text">{world.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {settings.imageProvider !== 'none' && (
            <button
              onClick={handleManualImageGen}
              disabled={store.isGeneratingImage}
              className="px-3 py-1.5 text-xs rounded-lg border border-white/[0.08] text-game-muted hover:border-indigo-400/40 hover:text-indigo-300 transition-all duration-200 disabled:opacity-40"
            >
              🎲 生成場景
            </button>
          )}
          <button
            onClick={() => setPage('story-log')}
            className="px-3 py-1.5 text-xs rounded-lg border border-white/[0.08] text-game-muted hover:border-indigo-400/40 hover:text-indigo-300 transition-all duration-200"
          >
            📖 故事日誌
          </button>
          <button
            onClick={() => setPage('settings')}
            className="px-3 py-1.5 text-xs rounded-lg border border-white/[0.08] text-game-muted hover:border-indigo-400/40 hover:text-indigo-300 transition-all duration-200"
          >
            設定
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Left: Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Pending character confirmations */}
          {pendingChars.length > 0 && (
            <div className="px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/20">
              <p className="text-sm font-medium text-indigo-300 mb-2">AI 建議新增角色：</p>
              <div className="space-y-2">
                {pendingChars.map((char, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
                    <span className="text-sm text-game-text">
                      {char.name} ({char.gender}, {char.age}歲)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirmNewCharacter(char, i)}
                        className="px-3 py-1 text-xs rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                      >
                        確認新增
                      </button>
                      <button
                        onClick={() => handleSkipNewCharacter(i)}
                        className="px-3 py-1 text-xs rounded-lg text-game-muted hover:text-game-text transition-colors"
                      >
                        跳過
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-2xl mx-auto space-y-3">
              {store.entries.map((entry) => (
                <ChatBubble
                  key={entry.id}
                  entry={entry}
                  characters={characters}
                  hasImage={store.currentImagePath !== null}
                />
              ))}

              {/* Processing indicator */}
              {store.isProcessing && (
                <div className="flex justify-start chat-bubble-enter">
                  <div className="flex gap-3 max-w-[70%]">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <span className="generating-pulse text-sm">✦</span>
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-game-panel/80 border border-white/[0.06] text-sm text-game-muted">
                      AI 回應中...
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-white/[0.06] p-4 shrink-0">
            <div className="max-w-2xl mx-auto flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={store.isProcessing}
                placeholder={
                  store.isProcessing ? 'AI 回應中...' : `輸入 ${player?.name ?? '你'} 的動作或對話...`
                }
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-game-text placeholder-game-muted/50 focus:border-indigo-400/50 outline-none disabled:opacity-40 transition-all duration-200"
              />
              <button
                onClick={handleSend}
                disabled={store.isProcessing || !playerInput.trim()}
                className="btn-primary px-6 py-3 rounded-xl font-medium text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none shadow-lg shadow-indigo-500/25"
              >
                發送
              </button>
            </div>
          </div>
        </div>

        {/* Right: Scene Panel */}
        {settings.imageProvider !== 'none' && (
          <div className="w-80 shrink-0 border-l border-white/[0.06] bg-game-panel/30 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-6">
              {store.isGeneratingImage ? (
                <div className="text-center text-game-muted">
                  <div className="text-5xl mb-4 generating-pulse">🎨</div>
                  <p className="text-sm">繪製中...</p>
                </div>
              ) : store.currentImagePath ? (
                <img
                  src={`file://${store.currentImagePath}`}
                  alt="場景插畫"
                  className="max-w-full max-h-full rounded-2xl scene-image-enter object-contain shadow-2xl"
                />
              ) : (
                <div className="text-center text-game-muted/40">
                  <p className="text-5xl mb-4">🖼️</p>
                  <p className="text-sm">尚無場景插畫</p>
                  <p className="text-xs mt-1">點擊上方 🎲 生成</p>
                </div>
              )}
            </div>

            {store.worldState && (
              <div className="p-4 border-t border-white/[0.06] bg-game-panel/60 backdrop-blur-sm">
                <p className="font-semibold text-game-text mb-2">{store.worldState.scene}</p>
                <div className="flex items-center gap-3 text-xs text-game-muted">
                  <span>🕐 {store.worldState.time}</span>
                  <span>🌤 {store.worldState.weather}</span>
                </div>
                {characters.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <p className="text-xs text-game-muted/60 mb-1.5">在場角色</p>
                    <div className="flex flex-wrap gap-1.5">
                      {characters.slice(0, 8).map((c) => (
                        <span key={c.id} className="inline-block px-2 py-0.5 text-xs rounded-md bg-white/[0.04] border border-white/[0.06] text-game-muted">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ChatBubble({
  entry,
  characters,
}: {
  entry: StoryEntry
  characters: Character[]
  hasImage: boolean
}) {
  const character = characters.find((c) => c.id === entry.speakerId)
  const isNarration = entry.type === 'narration'
  const isAction = entry.type === 'action'
  const isPlayer = character?.isPlayer

  if (isNarration) {
    return (
      <div className="chat-bubble-enter flex justify-center">
        <div className="max-w-lg px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.04] text-center">
          <p className="text-sm text-game-muted italic leading-relaxed">{entry.content}</p>
        </div>
      </div>
    )
  }

  if (isAction) {
    return (
      <div className="chat-bubble-enter flex justify-center">
        <p className="text-sm text-game-muted">
          <span className="font-semibold text-game-text">{entry.speakerName}</span> {entry.content}
        </p>
      </div>
    )
  }

  return (
    <div className={`chat-bubble-enter flex ${isPlayer ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2.5 max-w-[75%] ${isPlayer ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-lg ${
            isPlayer
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/25'
              : 'bg-game-panel text-game-muted ring-1 ring-white/[0.08]'
          }`}
        >
          {entry.speakerName.charAt(0)}
        </div>

        <div className={`min-w-0 ${isPlayer ? 'items-end' : ''}`}>
          <div className={`flex items-center gap-2 mb-1 ${isPlayer ? 'justify-end' : ''}`}>
            <span className="text-xs text-game-muted">{entry.speakerName}</span>
            {entry.emotion && (
              <span className="text-xs text-game-muted/50">({entry.emotion})</span>
            )}
          </div>
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isPlayer
                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-md shadow-lg shadow-indigo-500/20'
                : 'bg-game-panel/80 text-game-text rounded-tl-md border border-white/[0.06]'
            }`}
          >
            <p>{entry.content}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
