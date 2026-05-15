import React, { useState, useCallback } from 'react'
import { useI18n } from '../i18n'

interface GMEntry {
  id: string
  role: 'user' | 'gm'
  content: string
}

interface Props {
  worldId: string
  onClose: () => void
}

export default function GMPanel({ worldId, onClose }: Props) {
  const { t } = useI18n()
  const [entries, setEntries] = useState<GMEntry[]>([])
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleSend = useCallback(async () => {
    const cmd = input.trim()
    if (!cmd || processing) return
    setInput('')

    const userEntry: GMEntry = { id: Date.now().toString(), role: 'user', content: cmd }
    setEntries((prev) => [...prev, userEntry])
    setProcessing(true)

    try {
      const result = await window.api.game.sendGMCommand(worldId, cmd)
      const gmEntry: GMEntry = {
        id: (Date.now() + 1).toString(),
        role: 'gm',
        content: result.message || 'Done.',
      }
      setEntries((prev) => [...prev, gmEntry])
    } catch (err: any) {
      const errEntry: GMEntry = {
        id: (Date.now() + 1).toString(),
        role: 'gm',
        content: 'Error: ' + (err?.message || 'Unknown error'),
      }
      setEntries((prev) => [...prev, errEntry])
    } finally {
      setProcessing(false)
    }
  }, [input, processing, worldId])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div className="w-80 shrink-0 border-l border-white/[0.07] bg-game-panel/80 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <span className="text-sm font-semibold text-game-highlight">{t('gmPanel.title')}</span>
        <button onClick={onClose} className="text-game-muted hover:text-game-text text-sm">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {entries.length === 0 && (
          <p className="text-xs text-game-muted text-center py-8">
            Input GM commands to modify world settings, characters, and rules.
Example: "Change weather to storm" or "Add a character named Bob"
          </p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
              entry.role === 'user'
                ? 'bg-indigo-600/80 text-white'
                : 'bg-game-panel/80 text-game-text border border-white/[0.07]'
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap">{entry.content}</p>
            </div>
          </div>
        ))}
        {processing && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl bg-game-panel/80 text-game-muted text-xs border border-white/[0.07]">
              {t('gmPanel.processing')}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/[0.07]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('gmPanel.placeholder')}
            disabled={processing}
            className="flex-1 bg-game-bg border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-game-text placeholder-game-muted/40 focus:border-game-highlight/30 outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={processing || !input.trim()}
            className="px-3 py-2 bg-game-highlight rounded-lg text-sm font-medium hover:bg-game-highlight/80 disabled:opacity-40 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
