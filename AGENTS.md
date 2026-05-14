# AI Novel Game — AGENTS.md（AI 開發指南）

## 專案概述

AI Novel Game 是一款 Electron 桌面應用，提供 AI 驅動的互動敘事遊戲。使用者建立自訂的虛構世界，透過文字輸入與 AI 互動，體驗由 LLM 生成的劇情、對話、角色演變與世界變化。

- **類型**：獨立 Electron 桌面應用
- **語言**：TypeScript（全端）
- **UI 語言**：程式碼使用英文，遊戲內容使用繁體中文
- **目前版本**：1.0.0
- **GitHub**：https://github.com/s17179XTY/AIGame

---

## 技術棧

| 層 | 技術 | 用途 |
|---|------|------|
| 桌面框架 | Electron 33 | 視窗管理、系統整合 |
| 建置工具 | electron-vite 5 + Vite 5 | 三目標打包（main / preload / renderer） |
| 前端 | React 18 + TypeScript | UI 渲染 |
| 樣式 | Tailwind CSS 3 | 暗色遊戲主題 UI，自訂 `game-*` 色系 |
| 狀態管理 | Zustand 5 | 前端全域狀態 |
| 資料庫 | better-sqlite3 12 | 本地 SQLite，WAL 模式，儲存於 `userData/aigame.db` |
| LLM SDK | openai / @anthropic-ai/sdk / @google/generative-ai | 多 provider AI 整合 |
| 原生重編譯 | @electron/rebuild 4 | 為 Electron 的 Node 版本重編譯 better-sqlite3 |
| 打包 | electron-builder 26 | Windows NSIS 安裝程式 |

### 關鍵依賴版本

```json
{
  "electron": "^33.4.0",          // ⚠️ 鎖定 33，electron-vite 5 不相容 Electron 42+
  "electron-vite": "^5.0.0",       // 鎖定 v5，peer dep 限制 Vite 5.x
  "vite": "^5.4.21",               // 不可升級到 6+
  "@vitejs/plugin-react": "^4.7.0",// 必須 v4，v5 不相容
  "typescript": "^6.0.3",          // 使用 TS 6，baseUrl 已棄用
  "react": "^18.3.1",
  "zustand": "^5.0.13",
  "better-sqlite3": "^12.10.0",
  "openai": "^6.37.0",
  "@anthropic-ai/sdk": "^0.95.2",
  "@google/generative-ai": "^0.24.1"
}
```

---

## 專案結構

```
AIGame/
  package.json                  # Scripts: dev / build / preview / package / postinstall
  electron.vite.config.ts       # 三目標 electron-vite 設定
  tsconfig.json / .node / .web   # TypeScript 設定（project references）
  tailwind.config.js            # 自訂 game-* 色系、動畫
  postcss.config.js
  electron-builder.yml          # Windows NSIS 打包設定
  src/
    main/                       # 主進程
      index.ts                  # BrowserWindow 建立、生命週期
      database.ts               # SQLite 初始化、5 張表的 schema migration
      ipc-handlers.ts           # 所有 ipcMain.handle 註冊
      services/
        types.ts                # ⭐ 所有型別定義（專案的型別唯一來源）
        world.ts                # World CRUD + WorldState 管理
        character.ts            # Character CRUD + visual anchors
        game.ts                 # 遊戲引擎（Prompt 組裝 → LLM → 解析 → 狀態更新）
        settings.ts             # 設定讀寫 + testLLMConnection()
        llm/                    # LLMProvider 介面 + 3 個實作 + createLLMProvider 工廠
          index.ts              # LLMProvider 介面 + createLLMProvider()
          openai.ts             # OpenAI 相容（GPT-4o、JSON mode、baseUrl 支援）
          anthropic.ts          # Anthropic 相容（Claude、baseUrl 支援）
          gemini.ts             # Google Gemini
        image/                  # ImageProvider 介面 + DALL-E + Stability AI
          index.ts              # ImageProvider 介面
          openai.ts             # DALL-E 3（下載圖片，不支援 seed）
          stability.ts          # Stability AI（v2beta，支援 seed）
    preload/
      index.ts                  # contextBridge: window.api.*
    renderer/
      index.html                # 入口 HTML
      src/
        main.tsx                # ReactDOM.createRoot
        App.tsx                 # 簡單頁面切換（無 router），首次載入時 loadSettings()
        env.d.ts                # window.api 型別宣告
        index.css               # Tailwind 指令 + 全域樣式 + 動畫 + glass-panel/gradient-text/btn-primary 工具類
        stores/
          appStore.ts           # currentPage, selectedWorldId（路由狀態）
          settingsStore.ts      # 從主進程載入/更新設定
          gameStore.ts          # StoryEntry 清單、WorldState、圖片狀態
        pages/
          HomePage.tsx          # 世界列表、進入/刪除
          SettingsPage.tsx      # API 設定、測試連線、圖片偏好（英文 UI）
          WorldCreatePage.tsx   # 世界 + 玩家 + NPC 建立表單
          WorldPreviewPage.tsx  # AI 預覽（v1 為 placeholder）
          GamePage.tsx          # 核心遊戲：左側聊天 + 右側場景插畫
          StoryLogPage.tsx      # 時間線故事日誌
    out/                        # 建置輸出（gitignored）
```

---

## 架構：Electron 三層模型

```
Renderer (React)
  Pages:  HomePage, SettingsPage, WorldCreatePage, GamePage, StoryLogPage
  Stores: appStore（路由）、settingsStore、gameStore
  |
  |  window.api.*  (contextBridge)
  |
Preload
  src/preload/index.ts
    暴露: api.world.* / api.character.* / api.game.* / api.image.* / api.settings.* / api.story.*
  |
  |  ipcMain.handle(...)
  |
Main Process
  index.ts       - BrowserWindow（1400x900, min 1024x700）
  database.ts    - SQLite（5 tables, WAL, foreign keys）
  ipc-handlers.ts - 所有 IPC 路由註冊
  services/      - 業務邏輯
```

**安全設定**：`contextIsolation: true`, `nodeIntegration: false`, `sandbox: false`。Renderer 只能透過 preload IPC 通訊。API keys 以純文字儲存在 SQLite `settings` 表中。

---

## 資料庫 Schema

所有表儲存在 `userData/aigame.db`，WAL 模式，啟用 foreign keys。JSON 欄位手動序列化/反序列化（未使用 SQLite JSON extension）。

| 表 | 用途 | 關鍵欄位 |
|---|------|------|
| `worlds` | 世界定義 | id, name, config(JSON) |
| `characters` | 角色 | world_id(FK), is_player, is_dynamic, is_locked, visual_anchor(JSON) |
| `world_state` | 即時世界狀態 | world_id(UNIQUE FK), scene, time, weather, character_emotions(JSON), relationships(JSON), recent_events(JSON) |
| `story_log` | 故事條目 | world_id(FK), sequence, speaker_id(FK), type, emotion, image_trigger_context(JSON) |
| `settings` | 應用設定 | key(PRIMARY), value |

---

## 核心概念

### AppSettings（設定模型）

```typescript
interface AppSettings {
  llmProvider: 'openai' | 'anthropic' | 'gemini'
  llmModel: string
  apiKey: string           // 所有 LLM provider 共用
  apiBaseUrl: string        // 可選自訂端點（LM Studio 等需包含 /v1）
  imageProvider: 'openai' | 'stability' | 'none'
  imageModel: string
  stabilityApiKey: string   // Stability AI 獨立 key
  imageFrequency: 'conservative' | 'standard' | 'rich'
}
```

### LLM Provider 工廠

`src/main/services/llm/index.ts` 的 `createLLMProvider(settings)` 根據 `llmProvider` 建立對應實例。OpenAI 和 Anthropic 支援自訂 baseUrl（適用於 LM Studio、Ollama 等本地/代理服務）。Gemini 也支援 baseUrl。

### Game Engine 流程（processGameAction）

1. **Prompt 組裝**：世界設定 + 世界狀態（場景/時間/天氣/情緒/關係/事件）+ 最近 10 條故事 + 玩家輸入
2. **LLM 呼叫**：透過 `createLLMProvider(settings)`，請求 JSON 格式輸出
   - 偵測本地模型（localhost/127.0.0.1/192.168.）時跳過 `response_format: json_object`
   - 若因 `response_format` 報錯，自動降級重試（不加 json_object）
3. **回應解析 (parseLLMOutput)**：三層策略
   - Strategy 1：從文字中找 `{...}` 邊界提取 JSON
   - Strategy 2：移除 markdown code block
   - Fallback：整個回應當作 narration 顯示
4. **狀態更新**：合併情緒變化、關係更新、新事件到 world_state
5. **圖片觸發評估**：依 frequency 偏好過濾（conservative/standard/rich）
6. **故事記錄**：所有 narration 和 dialogues 寫入 story_log

### 圖片系統

- **三級觸發**：scene（場景變化）> behavior（重要行為）> none（純對話）
- **頻率偏好**：conservative（僅場景）/ standard（場景 + 重要行為）/ rich（更多觸發）
- **非同步管線**：文字立即顯示，右側面板顯示生成中佔位，圖片完成後淡入
- **手動觸發**：點擊相機按鈕或訊息旁的圖示
- **Visual Anchors**：儲存 seed、prompt 模板、最後圖片路徑以維持角色一致性
- **注意**：DALL-E 3 不支援 seed（僅 DALL-E 2 支援）

### 測試連線（testLLMConnection）

位於 `src/main/services/settings.ts`。使用動態 `import()` 按需載入 SDK。以最小請求測試連線（max_tokens: 5, 訊息: "Hi"）。**必須驗證回應內容**（檢查 `choices[0].message.content` 存在），因為 LM Studio 等本地伺服器即使端點錯誤也可能回傳 200。

---

## IPC 通道對照表

所有通道常數定義在 `types.ts` 的 `IPC_CHANNELS`。

| 分類 | 通道 | Preload 方法 |
|------|------|------|
| World | `world:create` | `api.world.create(config)` |
| World | `world:list` | `api.world.list()` |
| World | `world:get` | `api.world.get(id)` |
| World | `world:update` | `api.world.update(id, updates)` |
| World | `world:delete` | `api.world.delete(id)` |
| World | `world:state:get` | `api.world.getState(worldId)` |
| Character | `character:create` | `api.character.create(worldId, config, isPlayer?, isDynamic?)` |
| Character | `character:list` | `api.character.list(worldId)` |
| Character | `character:update` | `api.character.update(id, updates)` |
| Character | `character:delete` | `api.character.delete(id)` |
| Character | `character:generate-avatar` | `api.character.generateAvatar(id)` |
| Game | `game:action` | `api.game.sendAction(action)` |
| Image | `image:generate-scene` | `api.image.generateScene(prompt)` |
| Settings | `settings:test-llm` | `api.settings.testLLM(provider, key, model, url?)` |
| Settings | `settings:get` | `api.settings.get()` |
| Settings | `settings:update` | `api.settings.update(updates)` |
| Story | `story:get-log` | `api.story.getLog(worldId, limit?, offset?)` |
| Story | `story:get-snapshot` | `api.story.getSnapshot(worldId)` |

---

## 開發指令

```powershell
npm install        # 安裝依賴 + 自動重編譯 better-sqlite3（postinstall）
npm run dev        # 開發模式，HMR
npm run build      # 僅生產建置
npm run package    # 打包 Windows 安裝程式
```

---

## 已知問題與注意事項

### 建置與執行時期
1. **Electron 版本鎖定在 33**：electron-vite 5 不相容 Electron 42+。升級前必須驗證相容性。
2. **better-sqlite3 需重編譯**：postinstall 執行 `electron-rebuild`。若出現 NODE_MODULE_VERSION 錯誤，手動執行：`npx @electron/rebuild -m . -o better-sqlite3`
3. **Vite 鎖定 5.x**：electron-vite 5 的 peer dependency 限制。@vitejs/plugin-react 必須是 v4。
4. **TypeScript 6**：`baseUrl` 選項已棄用，需改用 `paths`（目前 tsconfig.web.json 有棄用警告但無功能影響）

### 🔴 PowerShell 編碼損毀（重要！）
**絕對不要**使用 PowerShell 字串操作（`Get-Content -Raw` + `replace` + `Set-Content`）編輯包含 CJK 字元的檔案。應使用 Node.js（`fs.readFileSync` + `fs.writeFileSync` with `'utf8'`）進行檔案編輯。PowerShell 的 `Out-File -Encoding utf8` 會加入 BOM，應使用 `[System.IO.File]::WriteAllText` 或 Node.js。

### 功能限制（v1）
5. **WorldPreviewPage 為 placeholder**：AI 預覽/自動填寫世界設定尚未實作
6. **API keys 以純文字儲存**於 settings 表
7. **角色關係圖**（force-directed）未實作
8. **虛擬滾動**未實作（長聊天記錄可能有效能問題）
9. **語音功能**已完全移除
10. **SettingsPage 使用英文 UI**：為避免 PowerShell UTF-8 損毀而從中文切換

### 圖片系統
11. **DALL-E 3 不支援 seed**：Visual anchor seeds 僅在 Stability AI 有效
12. **Stability AI API**：使用 v2beta 端點，可能需要更新
13. **無圖片清理**：生成的圖片累積在 `userData/images/`

### LM Studio / 本地模型相容性
14. **apiBaseUrl 必須包含 `/v1`**：正確格式為 `http://192.168.x.x:port/v1`，不含 `/v1` 會導致 LM Studio 回傳空回應
15. **json_object 格式**：多數本地模型不支援 `response_format: { type: 'json_object' }`。程式已實作自動偵測（localhost/127.0.0.1/192.168. 網段跳過）與自動降級重試（若因 response_format 報錯則移除重試）
16. **測試連線驗證**：`testLLMConnection` 會檢查回應內容是否有效，避免 LM Studio 錯誤端點回傳 200 造成的假陽性

---

## 已修復的 Bugs（歷史記錄）

### Round 1 — ReferenceError + Import 路徑
- `game.ts:172`：`buildPrompt()` 內使用 `action.worldId` 但 `action` 不在作用域 → 改為 `world.id`
- `settings.ts:65`：`new GoogleGenerativeAI(apiKey, { baseUrl })` 建構子只接受 1 個參數 → 修正
- `llm/gemini.ts`：`baseUrl` 參數儲存但未使用 → 在 `getModel()` 和 `chat()` 中正確傳入
- 7 個檔案：`../../types` → `../types`（import 路徑指向不存在的 `src/main/types`）

### Round 2 — choices[0] 崩潰 + LM Studio 相容性
- `llm/openai.ts:45`：`response.choices[0]?.message?.content` → LM Studio 回傳空回應時 `choices` 為 undefined，在 `?.` 前就崩潰 → 加入 try-catch + `Array.isArray` 檢查
- `game.ts`：新增 `isLocalModel` 偵測，本地模型跳過 `json_object`；新增自動降級重試
- `settings.ts`：測試連線加入回應內容驗證，防止假陽性

### Round 3 — isLocalModel 失效 + 測試假陽性 + json_object 雙重防禦
- `game.ts:45`：`startsWith('192.168.')` → `includes('192.168.')`（URL 以 `http://` 開頭導致 startsWith 永遠 false）
- `settings.ts`：`testLLMConnection` 檢查 `testResponse.choices[0]?.message?.content` 是否存在
- `llm/openai.ts`：所有 `localhost`/`127.0.0.1` 檢測擴展到包含 `192.168.`；錯誤訊息加入 `json_object` 提示

---

## 編碼規範

### 命名
- 檔案：camelCase（`gameStore.ts`），頁面元件 PascalCase（`GamePage.tsx`）
- 函數：camelCase（`createWorld`, `processGameAction`）
- 型別/介面：PascalCase（`WorldConfig`, `StructuredLLMOutput`）
- 常數：UPPER_SNAKE_CASE（`IPC_CHANNELS`, `DEFAULT_SETTINGS`）
- DB 欄位：snake_case（`world_id`, `created_at`）

### 模組組織
- `services/types.ts` 是所有共享型別的**唯一來源**
- 主進程服務按功能分離（每個網域一個檔案）
- Renderer 使用 pages + stores 分離
- IPC 通道遵循 `domain:action` 命名（`world:create`）

### 錯誤處理
- 主進程 handlers 拋出錯誤，Electron 傳播到 renderer
- Renderer 包裹 IPC 呼叫於 try-catch，透過 `alert()` 顯示
- 圖片生成失敗為靜默降級

### UI 設計系統
- 暗色主題：`bg-game-bg` (#0b1120), `bg-game-panel` (#1e293b)
- 強調色：`game-highlight` (#6366f1 indigo)
- 文字：`game-text` (#f1f5f9), `game-muted` (#94a3b8)
- 工具類：`.glass-panel`（毛玻璃效果）、`.gradient-text`（漸層文字）、`.btn-primary`（漸層按鈕）
- 動畫：`fadeIn`, `slideUp`, `pulseSoft`, `glow`
- 字型：Inter > Segoe UI > Microsoft JhengHei > PingFang TC > Noto Sans TC（中英文混合）

### 頁面路由
使用 Zustand `appStore.currentPage` 做簡單切換（非 React Router），值為 union type：
`'home' | 'world-create' | 'world-edit' | 'world-preview' | 'game' | 'settings' | 'story-log'`

---

## 安全編輯檢查清單

編輯檔案前務必確認：
- [ ] 檔案是否包含中文/CJK 字元？→ 使用 Node.js 而非 PowerShell
- [ ] 是否在 `services/types.ts` 新增或修改型別？→ 同步檢查所有參照
- [ ] 是否修改 IPC 通道？→ 同步更新 preload/index.ts 和 ipc-handlers.ts
- [ ] 是否修改 `response.choices` 相關程式碼？→ 務必使用 `?.` 或 `Array.isArray` 防禦
- [ ] 是否修改 LLM provider？→ 測試 OpenAI 官方 + LM Studio 兩種場景
- [ ] 行尾符號：主進程檔案使用 LF，renderer 檔案使用 CRLF（Git 自動轉換）

---

## 開發流程建議

1. `npm run dev` 啟動開發伺服器（HMR）
2. 修改程式碼後觀察 renderer 熱更新
3. 若修改 main process，需手動重啟（Ctrl+R 在 Electron 視窗中）
4. 提交前執行 `npx tsc --noEmit -p tsconfig.node.json` + `npm run build` 確認無誤
5. 使用 LM Studio 等本地模型測試時，確保 `apiBaseUrl` 包含 `/v1`