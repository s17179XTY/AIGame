# AI Novel Game — AGENTS.md（AI 開發指南）

> 最後更新：2026-05-14 | 版本：1.0.0

## 專案概述

AI Novel Game 是一款 Electron 桌面應用，提供 AI 驅動的互動敘事遊戲。使用者建立自訂的虛構世界，透過文字輸入與 AI 互動，體驗由 LLM 生成的劇情、對話、角色演變與世界變化。

- **類型**：獨立 Electron 桌面應用
- **語言**：TypeScript（全端），UI 程式碼英文，遊戲內容繁體中文
- **版本**：1.0.0
- **授權**：ISC
- **GitHub**：https://github.com/s17179XTY/AIGame
- **入口**：`out/main/index.js`（Electron main），`out/renderer/index.html`（renderer）

---

## 技術棧

| 層 | 技術 | 版本 | 用途 |
|---|------|------|------|
| 桌面框架 | Electron | ^33.4.0 | 視窗管理、系統整合 |
| 建置工具 | electron-vite | ^5.0.0 | 三目標打包（main / preload / renderer） |
| 打包器 | Vite | ^5.4.21 | 捆綁與 HMR |
| 前端 | React | ^18.3.1 | UI 渲染（StrictMode） |
| 樣式 | Tailwind CSS | ^3.4.19 | 暗色遊戲主題，自訂 `game-*` 色系 |
| 狀態管理 | Zustand | ^5.0.13 | 前端全域狀態（3 stores） |
| 資料庫 | better-sqlite3 | ^12.10.0 | 本地 SQLite，WAL 模式 |
| LLM SDK | openai | ^6.37.0 | OpenAI 相容 API（GPT-4o、JSON mode） |
| LLM SDK | @anthropic-ai/sdk | ^0.95.2 | Anthropic 相容 API（Claude） |
| LLM SDK | @google/generative-ai | ^0.24.1 | Google Gemini API |
| 原生重編譯 | @electron/rebuild | ^4.0.4 | 為 Electron Node 版本重編譯 better-sqlite3 |
| 打包 | electron-builder | ^26.8.1 | Windows NSIS 安裝程式 |

### ⚠️ 版本鎖定說明

- **Electron 鎖定 33**：electron-vite 5 不相容 Electron 42+，升級前必須驗證
- **Vite 鎖定 5.x**：electron-vite 5 peer dependency，不可升 6
- **@vitejs/plugin-react 鎖定 v4**：v5 不相容
- **TypeScript 6**：`baseUrl` 已棄用（目前有警告但無功能影響），需改用 `paths`

---

## 目錄結構（完整）

```
AIGame/
  package.json                  # Scripts: dev / build / preview / package / postinstall
  electron.vite.config.ts       # 三目標設定（main / preload / renderer），externalizeDepsPlugin
  tsconfig.json                 # 根設定，references node + web
  tsconfig.node.json            # main + preload 的 TS 設定（composite, bundler resolution）
  tsconfig.web.json             # renderer 的 TS 設定（react-jsx, paths: @/ → src/renderer/src/）
  tailwind.config.js            # game-* 色系、4 組動畫（fadeIn/slideUp/pulseSoft/glow）
  postcss.config.js             # Tailwind + autoprefixer
  electron-builder.yml          # Windows NSIS，appId: com.aigame.novel
  .gitignore                    # node_modules, out, dist, *.db, userData, .env
  LICENSE
  README.md
  AGENTS.md                     # 本檔案
  dev-error.log                 # 開發錯誤日誌（空）

  src/
    main/                       # ── 主進程 ──
      index.ts                  # BrowserWindow（1400x900, min 1024x700, 背景 #1a1a2e）
      database.ts               # SQLite 初始化、5 張表 schema、WAL、foreign keys
      ipc-handlers.ts           # 所有 ipcMain.handle 註冊（16 個通道）
      services/
        types.ts                # ⭐ 所有型別、介面、常數（專案的型別唯一來源）
        world.ts                # World CRUD + WorldState 管理（含 rowToWorld/rowToWorldState）
        character.ts            # Character CRUD + visual anchors + getPlayerCharacter
        game.ts                 # 遊戲引擎：processGameAction + buildPrompt + parseLLMOutput
        settings.ts             # getSettings / updateSettings / testLLMConnection
        llm/                    # LLM Provider 層
          index.ts              # LLMProvider 介面 + createLLMProvider 工廠函數
          openai.ts             # OpenAI 相容（含 response_format: json_object 支援）
          anthropic.ts          # Anthropic 相容（system/user 分離處理）
          gemini.ts             # Google Gemini（startChat + history + baseUrl）
        image/                  # 圖片 Provider 層
          index.ts              # ImageProvider 介面
          openai.ts             # DALL-E 3（https 下載圖片，不支援 seed）
          stability.ts          # Stability AI v2beta（FormData + fetch + base64 解碼）
    preload/
      index.ts                  # contextBridge.exposeInMainWorld('api', {...})，6 個分類
    renderer/
      index.html                # lang=zh-TW，Google Fonts Inter preconnect，<div id="root">
      src/
        main.tsx                # ReactDOM.createRoot + StrictMode
        App.tsx                 # 簡單 switch-case 頁面路由，首次載入 loadSettings()
        env.d.ts                # declare global Window.api: ElectronAPI
        index.css               # Tailwind 指令 + 全域樣式 + 捲軸 + 動畫 + glass-panel 工具類
        stores/
          appStore.ts           # currentPage（union type 7 種） + selectedWorldId
          settingsStore.ts      # settings + loaded + loadSettings/updateSettings
          gameStore.ts          # entries[] + worldState + isProcessing + images state
        pages/
          HomePage.tsx          # 世界列表（卡片式）、進入/刪除（confirm 對話框）
          SettingsPage.tsx      # LLM 設定 + 圖片設定 + 測試連線（英文 UI 避免編碼問題）
          WorldCreatePage.tsx   # 世界設定 + 玩家角色 + 重要 NPC 表單（CharacterForm 元件）
          WorldPreviewPage.tsx  # 完全為 placeholder：提示「此功能將在後續版本中完善」+ 略過按鈕
          GamePage.tsx          # 核心遊戲：左 70% 聊天區 + 右 30% 場景插畫面板
          StoryLogPage.tsx      # 時間線故事日誌（垂直時間線 + 彩色圓點標記類型）
  out/                          # 建置輸出（gitignored）
```

---

## 架構詳解

### Electron 三層模型

```
┌─────────────────────────────────────────────────────┐
│ Renderer (React 18, 瀏覽器環境)                       │
│                                                       │
│  App.tsx → switch(currentPage) → 6 個 Page 元件       │
│  Stores: appStore / settingsStore / gameStore         │
│  樣式: Tailwind CSS (game-* 色系) + 自訂動畫            │
│  字型: Inter (Google Fonts) + 系統中文字型               │
│                                                       │
│  ═══ contextBridge (window.api.*) ═══                │
│                                                       │
├─────────────────────────────────────────────────────┤
│ Preload (Node.js 環境，有限 API)                       │
│                                                       │
│  src/preload/index.ts                                 │
│  6 個分類: world / character / game / image /          │
│            settings / story                           │
│  每個方法呼叫 ipcRenderer.invoke(channel, ...args)     │
│                                                       │
│  ═══ ipcMain.handle ═══                              │
│                                                       │
├─────────────────────────────────────────────────────┤
│ Main Process (Node.js 完整環境)                        │
│                                                       │
│  index.ts: BrowserWindow 生命週期                      │
│  ipc-handlers.ts: 16 個 IPC 路由                       │
│  services/: 所有業務邏輯                                │
│  database.ts: better-sqlite3 (WAL, FK)                │
│                                                       │
│  安全: contextIsolation: true                          │
│        nodeIntegration: false                          │
│        sandbox: false                                  │
└─────────────────────────────────────────────────────┘
```

### 前端路由機制

不使用 React Router，而是透過 Zustand `appStore.currentPage` 做簡單切換：

```typescript
currentPage: 'home' | 'world-create' | 'world-edit' | 'world-preview' | 'game' | 'settings' | 'story-log'
```

App.tsx 首次載入時呼叫 `loadSettings()`，顯示 loading spinner，載入完成後根據 `currentPage` 渲染對應頁面。

### 前端狀態管理（3 Stores）

| Store | 關鍵狀態 | 方法 |
|-------|---------|------|
| `appStore` | `currentPage`, `selectedWorldId` | `setPage()`, `selectWorld()` |
| `settingsStore` | `settings: AppSettings`, `loaded` | `loadSettings()`, `updateSettings()` |
| `gameStore` | `entries[]`, `worldState`, `isProcessing`, `currentImagePath`, `isGeneratingImage`, `pendingNewCharacters[]` | `addEntry()`, `addEntries()`, `setWorldState()`, `clear()` 等 |

---

## 資料庫 Schema

資料庫：`userData/aigame.db`（better-sqlite3, WAL 模式, foreign keys 啟用）

### 表結構

| 表 | 用途 | 欄位 |
|---|------|------|
| `worlds` | 世界定義 | `id TEXT PK`, `name`, `config TEXT`(JSON), `created_at`, `updated_at` |
| `characters` | 角色 | `id TEXT PK`, `world_id FK`, `name`, `gender`, `age INT`, `appearance`, `personality`, `extra_prompt`, `is_player INT`, `is_dynamic INT`, `is_locked INT`, `visual_anchor TEXT`(JSON), `created_at` |
| `world_state` | 即時世界狀態 | `id TEXT PK`, `world_id UNIQUE FK`, `scene`, `time`, `weather`, `character_emotions TEXT`(JSON), `relationships TEXT`(JSON), `recent_events TEXT`(JSON), `last_image_context TEXT`(JSON), `updated_at` |
| `story_log` | 故事條目 | `id TEXT PK`, `world_id FK`, `sequence INT`, `speaker_id FK`, `speaker_name`, `content`, `type`, `emotion`, `image_trigger_context TEXT`(JSON), `image_path`, `created_at` |
| `settings` | 應用設定 | `key TEXT PK`, `value TEXT` |

### 索引

```sql
CREATE INDEX idx_characters_world ON characters(world_id);
CREATE INDEX idx_story_log_world ON story_log(world_id);
CREATE INDEX idx_story_log_sequence ON story_log(world_id, sequence);
```

### 注意事項

- JSON 欄位手動 `JSON.stringify` / `JSON.parse`（未使用 SQLite JSON extension）
- world_state 與 worlds 是一對一關係（`world_id UNIQUE`）
- 刪除 world 時，characters、world_state、story_log 由 `ON DELETE CASCADE` 自動刪除
- 刪除 character 時，story_log 的 `speaker_id` 設為 NULL（`ON DELETE SET NULL`）

---

## 核心型別體系

> 所有型別定義在 `src/main/services/types.ts`，約 250 行。以下是架構概覽。

### 世界層
- `WorldConfig` → `World`（含 id, timestamps）
- `WorldState`：scene, time, weather, characterEmotions, relationships, recentEvents, lastImageContext
- `Relationship`：characterA, characterB, relation, description

### 角色層
- `CharacterConfig` → `Character`（含 isPlayer, isDynamic, isLocked, visualAnchor）
- `VisualAnchor`：provider, seed, promptTemplate, lastImagePath

### LLM 層
- `LLMProviderType`：`'openai' | 'anthropic' | 'gemini'`
- `LLMMessage`：`{ role: 'system'|'user'|'assistant', content }`
- `LLMOptions`：model, temperature?, maxTokens?, responseFormat?
- `LLMResponse`：text, usage?（promptTokens, completionTokens）
- `StructuredLLMOutput`：narration, dialogues[], stateUpdate, imageTrigger?, newCharacters?[]
- `DialogueEntry`：speakerId, speakerName, type(`'dialogue'|'monologue'|'action'`), content, emotion
- `StateUpdate`：sceneChanged, newScene?, timeAdvanced, weatherChanged, newWeather?, emotionUpdates{}, relationshipUpdates[], newEvents[]
- `ImageTrigger`：shouldGenerate, level(`'scene'|'behavior'|'none'`), sceneDescription, charactersPresent[], keyAction
- `NewCharacterRequest`：name, gender, age, appearance, personality, role, relationToExisting

### 圖片層
- `ImageProviderType`：`'openai' | 'stability'`
- `ImageOptions`：size?, style?, seed?, quality?
- `ImageResult`：imagePath, seed?, revisedPrompt?
- `ImageContext`：sceneDescription, charactersPresent[], weather, time, keyAction

### 遊戲層
- `GameAction`：{ worldId, playerInput, requestImageGeneration? }
- `GameResponse`：{ entries[], narration, stateUpdate, imageTrigger?, newCharacterRequests?[] }
- `StoryEntry`：id, worldId, sequence, speakerId|null, speakerName, content, type, emotion, imageTriggerContext|null, imagePath|null, createdAt

### 設定層
- `AppSettings`：llmProvider, llmModel, apiKey, apiBaseUrl, imageProvider, imageModel, stabilityApiKey, imageFrequency
- `DEFAULT_SETTINGS`：openai / gpt-4o / 空 key / 空 baseUrl / none / dall-e-3 / 空 / standard

### IPC 通道常數

`IPC_CHANNELS` 物件包含 16 個通道常數，命名規則 `domain:action`：
- World: `world:create/get/list/update/delete`, `world:state:get`, `world:preview:generate`
- Character: `character:create/get/list/update/delete`, `character:generate-avatar`
- Game: `game:action`, `game:new-character-confirm`
- Image: `image:generate-scene`, `image:check-status`
- Settings: `settings:get/test-llm/update`
- Story: `story:get-log`, `story:get-snapshot`

---

## 遊戲引擎流程（processGameAction 完整步驟）

```
玩家輸入 → GamePage.tsx handleSend()
  │
  ▼
window.api.game.sendAction({ worldId, playerInput })
  │
  ▼
processGameAction(action: GameAction) → game.ts
  │
  ├─ 1. 載入資料
  │     getWorld(worldId) / getWorldState(worldId) / listCharacters / getPlayerCharacter
  │
  ├─ 2. 組裝 Prompt（buildPrompt）
  │     system prompt: 世界設定 + 場景/時間/天氣 + 角色列表 + 情緒 + 關係 + 近期事件
  │                   + JSON 格式規範（含範例 schema）
  │     context:     最近 10 條 story_log（反序查詢後再反轉）
  │     user message: 「玩家 {name} 的動作/對話: {playerInput}」
  │
  ├─ 3. LLM 呼叫
  │     isLocalModel 偵測：apiBaseUrl 含 localhost/127.0.0.1/192.168. → 跳過 json_object
  │     若因 response_format 報錯 → 自動降級重試（不加 json_object）
  │
  ├─ 4. 解析回應（parseLLMOutput）
  │     Strategy 1: 搜尋 { ... } 邊界提取 JSON
  │     Strategy 2: 移除 markdown code block（```json...```）
  │     Fallback: 整個回應當 narration 顯示
  │
  ├─ 5. 狀態更新（processStateUpdate）
  │     合併 scene/time/weather 變化、emotion 更新、relationship 更新、newEvents
  │
  ├─ 6. 圖片觸發（evaluateImageTrigger）
  │     conservative: 僅 scene level
  │     standard: scene + behavior
  │     rich: 更寬鬆
  │
  └─ 7. 故事記錄（createStoryEntries）
        寫入 narration + 所有 dialogues 到 story_log（含 sequence 序號）
        每個 dialogue 附加 imageTriggerContext（若有圖片觸發）
```

### Prompt 結構細節

系統提示（system role）包含以下區塊：
1. 角色聲明：`你是一個互動敘事遊戲的 AI 遊戲主持人 (Game Master)`
2. 世界設定：名稱、世界觀、規則、額外 system prompt
3. 當前狀態：場景、時間、天氣
4. 角色列表：每個角色的 ID、性別、年齡、性格、外觀（標記玩家角色）
5. 角色情緒：`{ 角色名: 情緒 }`
6. 角色關係：`{ characterA → characterB: relation }`
7. 近期事件：最近 10 條
8. JSON 輸出格式規範：含完整 schema 範例（narration, dialogues[], stateUpdate, imageTrigger, newCharacters）
9. 重要規則：使用角色 ID、必須含 narration + 至少一個 dialogue、對話生動自然等

### LLM Provider 實作差異

| Provider | System Prompt | JSON Mode | baseUrl | 特殊處理 |
|----------|--------------|-----------|---------|---------|
| OpenAI | messages[0].role='system' | `response_format: { type: 'json_object' }` | ✅ `baseURL` | 標準 OpenAI SDK |
| Anthropic | 獨立 `system` 參數 | ❌（不支援） | ✅ `baseURL` | system 和使用者訊息分開傳遞 |
| Gemini | `systemInstruction` 參數 | ❌（不支援） | ✅ `getGenerativeModel({ baseUrl })` | `startChat()` + history + `sendMessage()` |

---

## 圖片系統

### 兩個 Provider

| Provider | API | 種子支援 | 實作方式 |
|----------|-----|---------|---------|
| `OpenAIImageProvider` | DALL-E 3 (`client.images.generate`) | ❌ | OpenAI SDK + https 下載圖片到 `userData/images/` |
| `StabilityImageProvider` | Stability AI v2beta (`fetch` POST) | ✅ seed | `FormData` + `fetch()` + base64 解碼寫入檔案 |

### 觸發邏輯（evaluateImageTrigger）

- **訊號來源**：LLM 回應中的 `imageTrigger` 欄位
- **過濾規則**：依 `settings.imageFrequency` 過濾
  - `conservative`：僅 `level === 'scene'` 觸發
  - `standard`：`scene` + `behavior` 觸發
  - `rich`：更寬鬆，所有 `shouldGenerate` 為 true 的都觸發
- **手動觸發**：GamePage 的相機按鈕和訊息旁的圖示
- **非同步管線**：文字立即顯示 → 右側面板顯示 🎨 動畫 → 圖片 ready 後 `scene-image-enter` 淡入

### Character Avatar 生成

- 通道：`character:generate-avatar`
- 邏輯：組裝 prompt（Portrait of {name}, {gender}, {age}...）→ 呼叫圖片 provider → 儲存 visualAnchor（provider, seed, promptTemplate, lastImagePath）→ 更新 character

---

## 頁面功能詳解

### HomePage（首頁）
- 載入時呼叫 `api.world.list()`
- 卡片式世界列表，顯示名稱、世界觀摘要（截斷 80 字）、最後更新時間
- hover 時顯示刪除按鈕（紅色，含 confirm 對話框）
- 空白狀態：🌌 圖示 + 提示文字
- 右上角設定按鈕 → SettingsPage

### SettingsPage（設定）
- **英文 UI**（避免 PowerShell 編碼損毀中文）
- LLM 設定：Provider 下拉（OpenAI Compatible / Anthropic Compatible / Google Gemini）、Model Name 輸入、API Key（password）、API Base URL（選填，提示含 /v1 範例）
- Test Connection 按鈕：呼叫 `api.settings.testLLM()`，顯示綠色 OK 或紅色 FAIL
- 圖片設定：Provider 下拉（None / DALL-E / Stability）、Frequency 下拉、Stability API Key
- Save Settings / Cancel 按鈕

### WorldCreatePage（建立世界）
- 三個區塊：世界設定、主角設定、重要角色（可選，動態新增/刪除）
- 世界設定：名稱*、世界觀*、規則、系統 Prompt、初始場景
- 主角設定：名稱*、性別、年齡、外觀、性格、額外 Prompt
- 重要角色：CharacterForm 元件（名稱/性別/年齡 三欄 + 外觀 + 性格 + 額外 Prompt）
- 提交：建立 world → 建立 player character → 建立 NPCs → 導向 game

### WorldPreviewPage（預覽 - placeholder）
- ✨ 動畫 + 「AI 正在生成世界設定...」+ 「此功能將在後續版本中完善」
- 「略過，直接開始」按鈕 → GamePage

### GamePage（核心遊戲）
- 左側（flex-1）：聊天區域
  - 訊息列表：narration（置中斜體灰底）、action（置中）、dialogue（左右氣泡）
  - 玩家氣泡：右側、indigo 漸層、圓角
  - NPC 氣泡：左側、暗色面板、圓角
  - 每條訊息顯示：頭像（首字母）、名稱、情緒標籤
  - 聊天動畫：`chat-bubble-enter`（slideUp 0.3s）
  - 自動捲動到底部
- 右側（w-80）：場景插畫面板
  - 生成中：🎨 動畫 + 「繪製中...」
  - 有圖片：`<img src="file://...">`  + `scene-image-enter` 淡入
  - 無圖片：🖼️ + 「尚無場景插畫」
  - 底部資訊卡：場景名、時間、天氣、在場角色標籤
- 底部輸入區：輸入框 + 發送按鈕（Enter 發送）
- 新角色確認：AI 建議新角色時顯示確認對話框

### StoryLogPage（故事日誌）
- 載入時並行請求：`getLog` + `getWorld` + `listCharacters`
- 垂直時間線設計：左側漸層線 + 彩色圓點
  - narration = slate 灰、action = indigo 藍紫、monologue = purple 紫、dialogue = emerald 綠
- 每條顯示：時間戳（toLocaleTimeString zh-TW）、類型標籤、內容文字、情緒（若有）

---

## UI 設計系統

### 色系（Tailwind `game-*`）

```
game-bg:          #0b1120  深藍黑背景
game-panel:       #1e293b  面板/卡片
game-accent:      #334155  邊框/分隔線
game-highlight:   #6366f1  主要強調色（indigo-500）
game-highlight-soft: #818cf8  次要強調（indigo-400）
game-text:        #f1f5f9  主要文字
game-muted:       #94a3b8  次要/提示文字
game-success:     #34d399  成功
game-danger:      #f87171  危險/刪除
game-bubble-player:  #312e81  玩家氣泡
game-bubble-npc:     #1e293b  NPC 氣泡
game-bubble-narration: #0f172a  敘述氣泡
```

### 自訂 CSS 工具類（`index.css`）

- `.glass-panel`：毛玻璃效果（`backdrop-filter: blur(12px)`）
- `.gradient-text`：漸層文字（indigo 135deg，`background-clip: text`）
- `.btn-primary`：漸層按鈕（hover 時光影增強）
- `.chat-bubble-enter`：訊息進入動畫（slideUp 0.3s）
- `.scene-image-enter`：圖片淡入（fadeIn 0.5s）
- `.generating-pulse`：載入脈衝動畫（pulseSoft 2s）

### 動畫（Tailwind config）

- `fade-in`：opacity 0→1（0.5s）
- `slide-up`：translateY(10px)→0 + opacity（0.3s）
- `pulse-soft`：opacity 1↔0.6（2s）
- `glow`：boxShadow 變化（2s alternate）

### 字型

```css
font-family: 'Inter', 'Segoe UI', 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', system-ui, sans-serif;
```

Inter 從 Google Fonts 載入（`index.html` 中 preconnect 優化）。

### 捲軸樣式

寬度 6px，thumb `#334155`，track `#0f172a`，hover `#475569`。

---

## 已知問題清單

### 🔴 嚴重（可能導致資料損壞）
1. **PowerShell 編碼損毀**：`Get-Content -Raw` + `replace` + `Set-Content` 會破壞 CJK 多位元組字元。必須使用 Node.js `fs.readFileSync/fs.writeFileSync` with `'utf8'`。PowerShell `Out-File -Encoding utf8` 會添加 BOM，應使用 `[System.IO.File]::WriteAllText` 或 Node.js。

### 🟡 建置與執行時期
2. **Electron 33 鎖定**：不可升級到 42+
3. **better-sqlite3 重編譯**：若出現 NODE_MODULE_VERSION 錯誤，手動 `npx @electron/rebuild -m . -o better-sqlite3`
4. **Vite 5 / plugin-react v4 鎖定**
5. **TS6305 錯誤**：`tsc --noEmit -p tsconfig.node.json` 時 `out/` 目錄中的 `.d.ts` 檔案未從原始檔建置（複合專案問題，不影響 electron-vite 建置）
6. **electron.vite.config.ts TS2769**：`outDir` 屬性不被 electron-vite 型別接受（electron-vite 內部處理，無功能影響）

### 🟢 功能限制（v1）
7. **WorldPreviewPage 為 placeholder**：AI 預覽/自動填寫世界設定尚未實作
8. **API keys 純文字儲存**於 SQLite
9. **角色關係圖**（force-directed）未實作
10. **虛擬滾動**未實作（長聊天記錄效能問題）
11. **語音功能**已完全移除
12. **無圖片清理**：生成圖片累積在 `userData/images/`
13. **DALL-E 3 不支援 seed**：角色視覺一致性僅在 Stability AI 有效
14. **Stability AI v2beta**：API 可能需更新

### 🔵 LM Studio / 本地模型相容性
15. **apiBaseUrl 必須包含 `/v1`**：正確 `http://192.168.x.x:port/v1`，不含會回傳空回應
16. **json_object 格式**：多數本地模型不支援，程式已實作自動偵測（localhost/127.0.0.1/192.168.）+ 自動降級重試
17. **測試連線假陽性**：LM Studio 對錯誤端點仍回 200，程式已實作回應內容驗證

---

## 已修復 Bugs 歷史

### Round 1 — ReferenceError + Import 路徑修正
| 檔案 | 行號 | 問題 | 修復 |
|------|------|------|------|
| `game.ts` | 172 | `action.worldId` 在 `buildPrompt()` 內未定義 | → `world.id` |
| `settings.ts` | 65 | `new GoogleGenerativeAI(apiKey, { baseUrl })` 建構子參數錯誤 | → 只傳 apiKey，baseUrl 改由 `getGenerativeModel()` 傳入 |
| `llm/gemini.ts` | - | `baseUrl` 儲存但從未使用 | → `getModel()` 和 `chat()` 正確傳入 |
| 7 個檔案 | - | `../../types` 解析到不存在的 `src/main/types` | → `../types` 正確指向 `src/main/services/types` |

### Round 2 — choices[0] 崩潰 + 本地模型相容性
| 檔案 | 行號 | 問題 | 修復 |
|------|------|------|------|
| `llm/openai.ts` | 45 | `response.choices[0]` 在 LM Studio 空回應時崩潰 | → try-catch + `Array.isArray` 檢查 + 錯誤提示 |
| `game.ts` | 42-47 | 無本地模型偵測 | → 新增 `isLocalModel` 偵測，跳過 `json_object` |
| `game.ts` | 200+ | `parseLLMOutput` JSON 提取不完整 | → 新增 `{...}` 邊界搜尋（Strategy 1） |
| `settings.ts` | - | 測試連線不驗證回應 | → 檢查 `choices[0].message.content` 存在 |

### Round 3 — isLocalModel 失效 + 雙重防禦
| 檔案 | 行號 | 問題 | 修復 |
|------|------|------|------|
| `game.ts` | 45 | `startsWith('192.168.')` 不匹配 `http://` 前綴 | → `includes('192.168.')` |
| `game.ts` | 48-68 | `json_object` 報錯直接崩潰 | → 新增 try-catch + 自動降級重試 |
| `settings.ts` | 44-56 | 測試連線假陽性 | → 驗證回應內容 + 本地端點提示 `/v1` |
| `llm/openai.ts` | 48,57 | `localhost`/`127.0.0.1` 檢測不含 `192.168.` | → 全部位置加入 `192.168.` |

---

## 編碼規範

### 命名規則
- **檔案**：camelCase（`gameStore.ts`），頁面元件 PascalCase（`GamePage.tsx`）
- **函數**：camelCase（`createWorld`, `processGameAction`）
- **型別/介面**：PascalCase（`WorldConfig`, `StructuredLLMOutput`）
- **常數**：UPPER_SNAKE_CASE（`IPC_CHANNELS`, `DEFAULT_SETTINGS`）
- **DB 欄位**：snake_case（`world_id`, `created_at`）
- **IPC 通道**：`domain:action`（`world:create`, `game:action`）

### 模組組織
- `services/types.ts` 是**所有共享型別的唯一來源**
- 主進程服務按功能分離（一個網域一個檔案）
- Renderer 使用 pages + stores 分離
- 每個 service 檔案 export 明確的 CRUD 函數

### 錯誤處理
- 主進程 handlers 拋出錯誤 → Electron 傳播到 renderer → `catch` 顯示 `alert()`
- 圖片生成失敗：靜默降級（不影響遊戲進行）
- LLM 呼叫失敗：自動降級重試（移除 json_object）→ 若再失敗則 alert

### 行尾符號
- 主進程檔案：LF
- Renderer 檔案：CRLF
- Git `core.autocrlf` 自動處理轉換

---

## 安全編輯檢查清單

在修改程式碼之前，確認以下事項：

- [ ] 檔案是否包含中文/CJK？→ 使用 Node.js `fs` 模組，不用 PowerShell
- [ ] 是否修改 `types.ts`？→ 檢查所有 import 此型別的檔案
- [ ] 是否修改 IPC 通道？→ 同步更新 preload/index.ts + ipc-handlers.ts
- [ ] 是否修改 LLM provider？→ 測試 OpenAI 官方 + LM Studio 兩種場景
- [ ] 是否修改 `response.choices` 相關？→ 務必 `Array.isArray` 或 `?.` 防禦
- [ ] 是否修改遊戲引擎？→ 確認 `parseLLMOutput` fallback 仍有效
- [ ] 是否寫入新檔案？→ 檢查 `.gitignore`，避免提交暫存檔

---

## 開發流程

```powershell
# 1. 啟動開發
npm run dev          # electron-vite dev（HMR for renderer）
                     # 修改 main process 需在 Electron 視窗中 Ctrl+R

# 2. 型別檢查（提交前）
npx tsc --noEmit -p tsconfig.node.json   # 主進程
npx tsc --noEmit -p tsconfig.web.json    # Renderer

# 3. 建置
npm run build        # 三目標建置（main/preload/renderer）

# 4. 打包
npm run package      # electron-builder → dist/ (NSIS installer)

# 5. 提交
git add <files>
git commit -m "type: description"
git push
```

### 測試 LM Studio 注意事項

1. 啟動 LM Studio，載入模型，確認 API 伺服器執行中
2. SettingsPage 中 `API Base URL` 設為 `http://localhost:1234/v1`（**必須含 `/v1`**）
3. `Provider` 選 `OpenAI Compatible`
4. `Model Name` 填入 LM Studio 顯示的完整模型名稱
5. 點擊 `Test Connection` → 應顯示綠色 `OK`
6. 遊戲中程式會自動偵測本地模型並跳過 `json_object` 格式
7. 若仍報錯，程式已實作自動降級重試機制