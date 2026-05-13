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
    'w-full bg-game-bg border border-game-accent/30 rounded-lg px-3 py-2 text-game-text focus:border-game-highlight outline-none resize-none'

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-game-accent/30">
        <button onClick={() => setPage('home')} className="text-game-muted hover:text-game-text">
          ← 返回
        </button>
        <h1 className="text-xl font-bold text-game-highlight">建立新世界</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* World Config */}
          <section className="bg-game-panel rounded-xl p-6 border border-game-accent/20">
            <h2 className="text-lg font-semibold mb-4 text-game-highlight">世界設定</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-game-muted mb-1">
                  世界名稱 <span className="text-game-highlight">*</span>
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
                <label className="block text-sm text-game-muted mb-1">
                  世界觀 <span className="text-game-highlight">*</span>
                </label>
                <textarea
                  value={worldConfig.worldview}
                  onChange={(e) => updateWorld('worldview', e.target.value)}
                  placeholder="描述這個世界的背景、歷史、魔法體系、種族、政治格局等..."
                  rows={4}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-game-muted mb-1">世界規則</label>
                <textarea
                  value={worldConfig.rules}
                  onChange={(e) => updateWorld('rules', e.target.value)}
                  placeholder="特殊規則或限制，如：此世界不存在復活魔法、龍族已滅絕等...（可留空，由 AI 補全）"
                  rows={2}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-game-muted mb-1">給 AI 的系統提示詞</label>
                <textarea
                  value={worldConfig.systemPrompt}
                  onChange={(e) => updateWorld('systemPrompt', e.target.value)}
                  placeholder="額外的 AI 行為指引，如：請用古風文言風格寫作、對話需幽默風趣等..."
                  rows={2}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-game-muted mb-1">初始場景</label>
                <input
                  type="text"
                  value={worldConfig.initialScene}
                  onChange={(e) => updateWorld('initialScene', e.target.value)}
                  placeholder="如：酒館、森林小徑、王城廣場...（可留空，由 AI 補全）"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Player Character */}
          <section className="bg-game-panel rounded-xl p-6 border border-game-accent/20">
            <h2 className="text-lg font-semibold mb-4 text-game-highlight">主角設定（你）</h2>
            <CharacterForm config={playerConfig} update={updatePlayer} inputClass={inputClass} />
          </section>

          {/* Important Characters */}
          <section className="bg-game-panel rounded-xl p-6 border border-game-accent/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-game-highlight">重要角色（可選）</h2>
              <button
                onClick={addImportantChar}
                className="px-3 py-1.5 text-sm border border-game-highlight/50 text-game-highlight rounded-lg hover:bg-game-highlight/10 transition-colors"
              >
                + 新增角色
              </button>
            </div>

            {importantChars.length === 0 && (
              <p className="text-sm text-game-muted">尚未添加重要角色，可由 AI 在遊戲中補全</p>
            )}

            {importantChars.map((char, i) => (
              <div key={i} className="mt-4 p-4 border border-game-accent/20 rounded-lg relative">
                <button
                  onClick={() => removeImportantChar(i)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-300 text-sm"
                >
                  ✕
                </button>
                <h3 className="text-sm font-semibold mb-3 text-game-muted">角色 #{i + 1}</h3>
                <CharacterForm
                  config={char}
                  update={(key, value) => updateImportantChar(i, key, value)}
                  inputClass={inputClass}
                />
              </div>
            ))}
          </section>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 bg-game-highlight rounded-lg font-medium text-lg hover:bg-game-highlight/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
}: {
  config: CharacterConfig
  update: (key: keyof CharacterConfig, value: string | number) => void
  inputClass: string
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-game-muted mb-1">名稱 *</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="角色名稱"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-game-muted mb-1">性別</label>
          <input
            type="text"
            value={config.gender}
            onChange={(e) => update('gender', e.target.value)}
            placeholder="男/女/其他"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-game-muted mb-1">年齡</label>
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
        <label className="block text-xs text-game-muted mb-1">外觀</label>
        <input
          type="text"
          value={config.appearance}
          onChange={(e) => update('appearance', e.target.value)}
          placeholder="身高、髮色、服裝風格等"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs text-game-muted mb-1">性格</label>
        <textarea
          value={config.personality}
          onChange={(e) => update('personality', e.target.value)}
          placeholder="核心性格特質、價值觀、說話風格..."
          rows={2}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs text-game-muted mb-1">額外 Prompt 要求</label>
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