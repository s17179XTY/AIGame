import React, { useState } from 'react'
import { useAppStore } from '../stores/appStore'
import type { WorldConfig, CharacterConfig } from '../../../main/services/types'

export default function WorldCreatePage() {
  const setPage = useAppStore((s) => s.setPage)
  const selectWorld = useAppStore((s) => s.selectWorld)

  const [worldConfig, setWorldConfig] = useState<WorldConfig>({
    name: '',
    worldview: '',
    rules: '',
    systemPrompt: '',
    initialScene: '',
  })

  const [playerConfig, setPlayerConfig] = useState<CharacterConfig>({
    name: '',
    gender: '',
    age: 25,
    appearance: '',
    personality: '',
    extraPrompt: '',
  })

  const [importantChars, setImportantChars] = useState<CharacterConfig[]>([])
  const [creating, setCreating] = useState(false)

  const updateWorld = <K extends keyof WorldConfig>(key: K, value: WorldConfig[K]) => {
    setWorldConfig((w) => ({ ...w, [key]: value }))
  }

  const updatePlayer = <K extends keyof CharacterConfig>(key: K, value: CharacterConfig[K]) => {
    setPlayerConfig((p) => ({ ...p, [key]: value }))
  }

  const addImportantChar = () => {
    setImportantChars([
      ...importantChars,
      { name: '', gender: '', age: 0, appearance: '', personality: '', extraPrompt: '' },
    ])
  }

  const updateImportantChar = (index: number, key: keyof CharacterConfig, value: string | number) => {
    setImportantChars((chars) =>
      chars.map((c, i) => (i === index ? { ...c, [key]: value } : c))
    )
  }

  const removeImportantChar = (index: number) => {
    setImportantChars((chars) => chars.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (!worldConfig.name || !worldConfig.worldview) {
      alert('請至少填寫世界名稱和世界觀')
      return
    }
    if (!playerConfig.name) {
      alert('請填寫主角名稱')
      return
    }

    setCreating(true)
    try {
      const world = await window.api.world.create(worldConfig)
      await window.api.character.create(world.id, playerConfig, true, false)

      for (const char of importantChars) {
        if (char.name) {
          await window.api.character.create(world.id, char, false, false)
        }
      }

      selectWorld(world.id)
      setPage('game')
    } catch (err: any) {
      alert('建立失敗: ' + (err.message ?? '未知錯誤'))
    } finally {
      setCreating(false)
    }
  }

  const inputClass =
    'w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-4 py-2.5 text-game-text placeholder-game-muted/40 focus:border-indigo-500/40 focus:bg-white/[0.07] outline-none transition-all duration-200'
  const textareaClass =
    'w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-4 py-2.5 text-game-text placeholder-game-muted/40 focus:border-indigo-500/40 focus:bg-white/[0.07] outline-none transition-all duration-200 resize-none'

  return (
    <div className="h-screen flex flex-col bg-game-bg">
      <header className="flex items-center gap-4 px-8 py-5 border-b border-white/[0.07]">
        <button
          onClick={() => setPage('home')}
          className="flex items-center gap-1.5 text-game-muted hover:text-game-text transition-colors text-sm"
        >
          ← 返回
        </button>
        <h1 className="text-xl font-bold gradient-text">建立新世界</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* World Config */}
          <section className="rounded-2xl bg-game-panel/60 border border-white/[0.07] p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">🌍</span>
              <h2 className="text-lg font-semibold text-game-text">世界設定</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-game-muted mb-2">
                  世界名稱 <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  value={worldConfig.name}
                  onChange={(e) => updateWorld('name', e.target.value)}
                  placeholder="例如：劍與魔法的大陸"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-game-muted mb-2">
                  世界觀 <span className="text-indigo-400">*</span>
                </label>
                <textarea
                  value={worldConfig.worldview}
                  onChange={(e) => updateWorld('worldview', e.target.value)}
                  placeholder="描述這個世界的背景、歷史、魔法體系、種族、政治格局等..."
                  rows={4}
                  className={textareaClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-game-muted mb-2">世界規則</label>
                <textarea
                  value={worldConfig.rules}
                  onChange={(e) => updateWorld('rules', e.target.value)}
                  placeholder="特殊規則或限制，如：此世界不存在時間魔法..."
                  rows={3}
                  className={textareaClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-game-muted mb-2">AI 系統 Prompt</label>
                <textarea
                  value={worldConfig.systemPrompt}
                  onChange={(e) => updateWorld('systemPrompt', e.target.value)}
                  placeholder="自定義系統提示詞（可留空，使用內建預設）"
                  rows={3}
                  className={textareaClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-game-muted mb-2">初始場景</label>
                <textarea
                  value={worldConfig.initialScene}
                  onChange={(e) => updateWorld('initialScene', e.target.value)}
                  placeholder="遊戲開始時的場景描述，例如：你在一間昏暗的酒館中醒來..."
                  rows={3}
                  className={textareaClass}
                />
              </div>
            </div>
          </section>

          {/* Player Character */}
          <section className="rounded-2xl bg-game-panel/60 border border-white/[0.07] p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">🦸</span>
              <h2 className="text-lg font-semibold text-game-text">主角設定（你）</h2>
            </div>
            <CharacterForm config={playerConfig} update={updatePlayer} inputClass={inputClass} textareaClass={textareaClass} />
          </section>

          {/* Important Characters */}
          <section className="rounded-2xl bg-game-panel/60 border border-white/[0.07] p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">👥</span>
                <h2 className="text-lg font-semibold text-game-text">重要角色（可選）</h2>
              </div>
              <button
                onClick={addImportantChar}
                className="px-4 py-2 text-sm rounded-xl border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/[0.06] hover:border-indigo-500/40 transition-all duration-200"
              >
                + 新增角色
              </button>
            </div>

            {importantChars.length === 0 && (
              <p className="text-sm text-game-muted py-4">尚未添加重要角色，可由 AI 在遊戲中補全</p>
            )}

            {importantChars.map((char, i) => (
              <div key={i} className="mt-4 p-5 rounded-xl border border-white/[0.10] relative bg-white/[0.02]">
                <button
                  onClick={() => removeImportantChar(i)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-red-400/60 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 text-sm"
                >
                  ✕
                </button>
                <h3 className="text-sm font-semibold mb-4 text-game-muted">角色 #{i + 1}</h3>
                <CharacterForm
                  config={char}
                  update={(key, value) => updateImportantChar(i, key, value)}
                  inputClass={inputClass}
                  textareaClass={textareaClass}
                />
              </div>
            ))}
          </section>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full btn-primary py-3.5 rounded-xl font-semibold text-base text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none shadow-lg shadow-indigo-500/25 transition-all duration-200"
          >
            {creating ? '建立中...' : '建立世界並開始冒險'}
          </button>
        </div>
      </main>
    </div>
  )
}

function CharacterForm({
  config,
  update,
  inputClass,
  textareaClass,
}: {
  config: CharacterConfig
  update: (key: keyof CharacterConfig, value: string | number) => void
  inputClass: string
  textareaClass: string
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-game-muted mb-1.5">名稱 *</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="角色名稱"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-game-muted mb-1.5">性別</label>
          <input
            type="text"
            value={config.gender}
            onChange={(e) => update('gender', e.target.value)}
            placeholder="男 / 女 / 其他"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-game-muted mb-1.5">年齡</label>
          <input
            type="number"
            value={config.age || ''}
            onChange={(e) => update('age', parseInt(e.target.value) || 0)}
            placeholder="25"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-game-muted mb-1.5">外觀</label>
        <input
          type="text"
          value={config.appearance}
          onChange={(e) => update('appearance', e.target.value)}
          placeholder="身高、髮色、服裝風格等"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-game-muted mb-1.5">性格</label>
        <textarea
          value={config.personality}
          onChange={(e) => update('personality', e.target.value)}
          placeholder="核心性格特徵、價值觀、說話風格..."
          rows={2}
          className={textareaClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-game-muted mb-1.5">額外 Prompt 要求</label>
        <input
          type="text"
          value={config.extraPrompt}
          onChange={(e) => update('extraPrompt', e.target.value)}
          placeholder="對 AI 生成此角色時的特別要求"
          className={inputClass}
        />
      </div>
    </div>
  )
}
