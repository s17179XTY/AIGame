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
        <div className="text-game-muted generating-pulse">載入遊戲中...</div>
      </div>
    )
  }

  const player = characters.find((c) => c.isPlayer)

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-game-accent/30 bg-game-panel/50 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage('home')}
            className="text-game-muted hover:text-game-text text-sm"
          >
            ← 退出
          </button>
          <h1 className="font-semibold">{world.name}</h1>
          {store.worldState && (
            <span className="text-xs text-game-muted">
              {store.worldState.scene} · {store.worldState.time}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage('story-log')}
            className="px-3 py-1 text-xs border border-game-accent/30 rounded-lg text-game-muted hover:text-game-text transition-colors"
          >
            日誌
          </button>
          {settings.imageProvider !== 'none' && (
            <button
              onClick={handleManualImageGen}
              disabled={store.isGeneratingImage}
              className="px-3 py-1 text-xs bg-game-accent/50 rounded-lg hover:bg-game-accent transition-colors disabled:opacity-50"
            >
              📷 生成畫面
            </button>
          )}
        </div>
      </header>

      {/* Pending character requests */}
      {pendingChars.length > 0 && (
        <div className="bg-game-highlight/20 border-b border-game-highlight/30 px-4 py-3">
          {pendingChars.map((char, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-game-highlight">新角色登場：</span>
              <span className="font-medium">{char.name}</span>
              <span className="text-game-muted">
                ({char.gender}, {char.age}歲, {char.personality})
              </span>
              <button
                onClick={() => handleConfirmNewCharacter(char, i)}
                className="px-2 py-0.5 bg-game-highlight rounded text-xs"
              >
                確認加入
              </button>
              <button
                onClick={() => handleSkipNewCharacter(i)}
                className="px-2 py-0.5 border border-game-muted/30 rounded text-xs text-game-muted"
              >
                略過
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {store.entries.length === 0 && (
              <div className="text-center text-game-muted py-20">
                <p className="text-lg">故事即將開始...</p>
                <p className="text-sm mt-2">在下方輸入你的第一個動作或對話</p>
              </div>
            )}

            {store.entries.map((entry) => (
              <ChatBubble
                key={entry.id}
                entry={entry}
                characters={characters}
                hasImage={settings.imageProvider !== 'none'}
              />
            ))}

            {store.isProcessing && (
              <div className="flex items-center gap-2 text-game-muted text-sm pl-4">
                <span className="generating-pulse">AI 正在回應...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="px-4 py-3 border-t border-game-accent/30 bg-game-panel/30">
            <div className="flex gap-2">
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
                className="flex-1 bg-game-bg border border-game-accent/30 rounded-lg px-4 py-2.5 text-game-text focus:border-game-highlight outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={store.isProcessing || !playerInput.trim()}
                className="px-5 py-2.5 bg-game-highlight rounded-lg font-medium hover:bg-game-highlight/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                發送
              </button>
            </div>
          </div>
        </div>

        {/* Right: Scene Panel */}
        {settings.imageProvider !== 'none' && (
          <div className="w-80 shrink-0 border-l border-game-accent/30 bg-game-panel/20 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-4">
              {store.isGeneratingImage ? (
                <div className="text-center text-game-muted">
                  <div className="generating-pulse text-4xl mb-3">🎨</div>
                  <p className="text-sm">繪製中...</p>
                </div>
              ) : store.currentImagePath ? (
                <img
                  src={`file://${store.currentImagePath}`}
                  alt="場景插圖"
                  className="max-w-full max-h-full rounded-lg scene-image-enter object-contain"
                />
              ) : (
                <div className="text-center text-game-muted/50">
                  <p className="text-4xl mb-3">🖼️</p>
                  <p className="text-sm">尚無場景插圖</p>
                  <p className="text-xs mt-1">點擊上方 📷 生成</p>
                </div>
              )}
            </div>

            {store.worldState && (
              <div className="p-3 border-t border-game-accent/30 text-xs text-game-muted">
                <p className="font-medium text-game-text mb-1">{store.worldState.scene}</p>
                <p>
                  {store.worldState.time} · {store.worldState.weather}
                </p>
                <div className="mt-2">
                  <p className="text-game-muted/70 mb-0.5">在場角色：</p>
                  {characters.slice(0, 5).map((c) => (
                    <span key={c.id} className="inline-block mr-1.5">
                      {c.name}
                    </span>
                  ))}
                </div>
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
  hasImage,
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
      <div className="chat-bubble-enter">
        <div className="mx-auto max-w-lg px-4 py-2 rounded-lg bg-game-bubble-narration border border-game-accent/10 text-center">
          <p className="text-sm text-game-muted italic leading-relaxed">{entry.content}</p>
        </div>
      </div>
    )
  }

  if (isAction) {
    return (
      <div className="chat-bubble-enter">
        <div className="mx-auto max-w-lg px-4 py-1.5 text-center">
          <p className="text-sm text-game-muted">
            <span className="font-medium text-game-text">{entry.speakerName}</span> {entry.content}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`chat-bubble-enter flex ${isPlayer ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[70%] ${isPlayer ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            isPlayer ? 'bg-game-highlight' : 'bg-game-accent'
          }`}
        >
          {entry.speakerName.charAt(0)}
        </div>

        <div>
          <div className={`flex items-center gap-2 mb-0.5 ${isPlayer ? 'justify-end' : ''}`}>
            <span className="text-xs text-game-muted">{entry.speakerName}</span>
            {entry.emotion && (
              <span className="text-xs text-game-muted/60">({entry.emotion})</span>
            )}
          </div>
          <div
            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
              isPlayer
                ? 'bg-game-bubble-player rounded-tr-sm'
                : 'bg-game-bubble-npc rounded-tl-sm'
            }`}
          >
            <p>{entry.content}</p>
          </div>
        </div>
      </div>
    </div>
  )
}