# AI Novel Game — 專案知識庫

## 專案概述

AI Novel Game 是一款 Electron 桌面應用，以 AI 大語言模型（LLM）驅動的互動敘事遊戲。使用者可建立多個完全自定義的虛構世界，透過文字輸入與 AI 互動，體驗由 AI 即時生成的劇情、對話、角色演化與世界變遷。可選配文生圖模型（DALL-E / Stability AI）為場景生成插圖。

- **類型**：單機 Electron 桌面應用
- **語言**：TypeScript（全端）
- **UI 語言**：繁體中文
- **當前版本**：v1.0.0
- **GitHub**：https://github.com/s17179XTY/AIGame

---

## 技術棧

| 層級 | 技術 | 用途 |
|------|------|------|
| 桌面框架 | Electron 33 | 視窗管理、系統整合 |
| 建置工具 | electron-vite 5 + Vite 5 | 三層打包（main / preload / renderer） |
| 前端 | React 18 + TypeScript | UI 渲染 |
| 樣式 | Tailwind CSS 3 | 深色主題遊戲風 UI |
| 狀態管理 | Zustand 5 | 前端全域狀態 |
| 資料庫 | better-sqlite3 12 | 本地 SQLite，WAL 模式 |
| LLM SDK | openai / @anthropic-ai/sdk / @google/generative-ai | 多廠商 AI 對接 |
| 原生模組重建 | @electron/rebuild 4 | npm install 後自動重建 better-sqlite3 |
| 打包 | electron-builder 26 | Windows NSIS installer |
| 執行環境 | Node.js 24 (開發) / Electron 33 內建 Node (執行) | |

---

## 架構：Electron 三層模型

```
┌─────────────────────────────────────────────────────┐
│  Renderer Process (React)                           │
│  src/renderer/                                      │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Pages     │  │  Stores   │  │  Components      │ │
│  │  HomePage  │  │  appStore │  │  ChatBubble (內嵌)│ │
│  │  Settings  │  │  settings │  │  ScenePanel (內嵌)│ │
│  │  WorldCreate│  │  gameStore│  │  InputBar (內嵌) │ │
│  │  GamePage  │  │           │  │                  │ │
│  │  StoryLog  │  │           │  │                  │ │
│  └───────────┘  └──────────┘  └──────────────────┘ │
│         │                                            │
│         │ window.api.* (contextBridge)               │
└─────────┼────────────────────────────────────────────┘
          │
┌─────────┼────────────────────────────────────────────┐
│  Preload (contextBridge)                             │
│  src/preload/index.ts                                │
│  暴露型別安全的 IPC 方法：                             │
│  api.world.* / api.character.* / api.game.*          │
│  api.image.* / api.settings.* / api.story.*          │
└─────────┼────────────────────────────────────────────┘
          │
┌─────────┼────────────────────────────────────────────┐
│  Main Process                                        │
│  src/main/                                           │
│  ┌──────────────┐  ┌───────────────────────────────┐ │
│  │ ipc-handlers  │  │  services/                     │ │
│  │  路由註冊     │  │  ├─ world.ts    (世界 CRUD)    │ │
│  │              │  │  ├─ character.ts(角色 CRUD)    │ │
│  │              │  │  ├─ game.ts     (遊戲引擎)     │ │
│  │              │  │  ├─ settings.ts (設定讀寫)     │ │
│  │              │  │  ├─ llm/        (LLM 廠商)     │ │
│  │              │  │  └─ image/      (圖片廠商)     │ │
│  └──────────────┘  └───────────────────────────────┘ │
│  ┌──────────────┐                                    │
│  │ database.ts   │  SQLite (better-sqlite3)           │
│  │ schema + init │  檔案位置：userData/aigame.db      │
│  └──────────────┘                                    │
└──────────────────────────────────────────────────────┘
```

**安全原則**：
- Renderer 不能直接存取 Node.js API（`nodeIntegration: false`）
- 所有系統操作必須透過 preload 暴露的 IPC 通道
- API Key 存於 SQLite settings 表（明文，未加密）
- `contextIsolation: true`，`sandbox: false`（electron-vite 要求）

---

## 目錄結構

```
AIGame/
├── package.json                 # 腳本：dev / build / preview / package / postinstall
├── electron.vite.config.ts      # electron-vite 三目標設定
├── tsconfig.json                # 根設定，引用 node + web
├── tsconfig.node.json           # main + preload 的 TS 設定
├── tsconfig.web.json            # renderer 的 TS 設定（含 @ 別名）
├── tailwind.config.js           # Tailwind 主題（game-* 色系、動畫）
├── postcss.config.js
├── electron-builder.yml         # 打包設定（Windows NSIS）
│
├── src/
│   ├── main/                    # Electron 主程序
│   │   ├── index.ts             # 入口：建立 BrowserWindow、生命週期
│   │   ├── database.ts          # SQLite 初始化、schema migration
│   │   ├── ipc-handlers.ts      # 所有 IPC handle 註冊
│   │   └── services/
│   │       ├── types.ts         # 全域型別定義（核心！）
│   │       ├── world.ts         # 世界 CRUD + WorldState 管理
│   │       ├── character.ts     # 角色 CRUD + 視覺錨點
│   │       ├── game.ts          # 遊戲引擎（Prompt 組裝 → LLM → 解析 → 狀態更新）
│   │       ├── settings.ts      # 設定讀寫（key-value 表）
│   │       ├── llm/
│   │       │   ├── index.ts     # LLMProvider 介面 + 匯出
│   │       │   ├── openai.ts    # OpenAI (GPT-4o, JSON mode)
│   │       │   ├── anthropic.ts # Anthropic (Claude)
│   │       │   └── gemini.ts    # Google Gemini
│   │       └── image/
│   │           ├── index.ts     # ImageProvider 介面 + 匯出
│   │           ├── openai.ts    # DALL-E 3
│   │           └── stability.ts # Stability AI
│   │
│   ├── preload/
│   │   └── index.ts             # contextBridge，暴露 window.api
│   │
│   └── renderer/                # React 前端
│       ├── index.html           # 入口 HTML
│       └── src/
│           ├── main.tsx          # ReactDOM.createRoot
│           ├── App.tsx           # 頁面路由（簡單 switch）
│           ├── env.d.ts          # window.api 型別宣告
│           ├── index.css         # Tailwind 指令 + 全域樣式
│           ├── stores/
│           │   ├── appStore.ts   # 當前頁面、選中世界 ID
│           │   ├── settingsStore.ts # 設定狀態（從 main process 載入）
│           │   └── gameStore.ts  # 遊戲狀態（對話記錄、世界狀態、圖片）
│           └── pages/
│               ├── HomePage.tsx       # 世界列表、進入/刪除
│               ├── SettingsPage.tsx   # API Key、模型廠商、生圖偏好
│               ├── WorldCreatePage.tsx # 世界 + 主角 + 重要角色表單
│               ├── WorldPreviewPage.tsx # AI 生成預覽（v1 為 placeholder）
│               ├── GamePage.tsx       # 核心遊戲介面
│               └── StoryLogPage.tsx   # 故事日誌時間線
│
├── out/                         # 建置輸出（git ignored）
├── build/                       # 打包資源（圖示等）
└── resources/                   # 靜態資源
```

---

## 核心概念

### 世界（World）
- 每個世界擁有獨立的 `WorldConfig`（世界觀、規則、系統提示詞、初始場景）
- 建立世界時同時初始化 `WorldState`（場景、時間、天氣、角色情緒、關係網路、近期事件）
- 世界狀態在每次 AI 回應後自動更新
- 支援多世界並存，首頁以列表呈現

### 角色（Character）
- 分為三類：
  - **玩家角色**（isPlayer = true）：建立世界時必填
  - **重要角色**（isDynamic = false）：使用者手動建立
  - **動態角色**（isDynamic = true）：AI 在劇情中自動生成，需使用者確認後加入
- 角色可鎖定（isLocked），防止 AI 擅自修改
- **視覺錨點（VisualAnchor）**：儲存 seed、prompt 模板、最後生成圖片路徑，用於保持角色形象一致性
- 頭像生成使用 `character:generate-avatar` IPC，調用圖片 API 後自動儲存錨點

### 遊戲引擎（Game Engine）
核心流程（`game.ts` → `processGameAction`）：

1. **Prompt 組裝**：將世界設定 + 世界狀態（場景/時間/天氣/情緒/關係/近期事件）+ 最近 10 條對話 + 玩家輸入組裝為 system prompt
2. **LLM 調用**：依設定選擇廠商，要求 JSON 格式輸出
3. **回應解析**：從 JSON 提取 narration、dialogues、stateUpdate、imageTrigger、newCharacters
4. **狀態更新**：合併情緒變化、關係更新、新事件到 world_state
5. **圖片觸發判斷**：依生圖頻率偏好（保守/標準/豐富）過濾觸發條件
6. **故事記錄**：所有敘述和對話寫入 story_log 表
7. **新角色處理**：若有 newCharacters 請求，返回給前端讓使用者確認

### 圖片系統
- **觸發三級制**：scene（場景變化） > behavior（重要行為） > none（純對話不觸發）
- **頻率偏好**：conservative（僅場景級）/ standard（場景+重要行為）/ rich（較多觸發）
- **非同步管線**：文字先顯示，右側畫面以「繪製中」動態佔位，完成後 fade-in
- **手動生圖**：玩家點擊 📷 按鈕或訊息旁相機圖示
- 若未設定圖片 API（imageProvider = 'none'），右側面板隱藏

### 設定（Settings）
- 以 key-value 形式儲存在 SQLite `settings` 表
- 支援三個 LLM 廠商各自的 API Key + 模型名稱
- 圖片廠商可選「不使用」
- `DEFAULT_SETTINGS` 定義於 `types.ts`

---

## 資料庫 Schema

所有表位於 `userData/aigame.db`，使用 WAL 模式，啟用外鍵約束。

| 表名 | 用途 | 關鍵欄位 |
|------|------|----------|
| `worlds` | 世界定義 | id, name, config(JSON) |
| `characters` | 角色定義 | world_id(FK), is_player, is_dynamic, is_locked, visual_anchor(JSON) |
| `world_state` | 世界即時狀態 | world_id(UNIQUE FK), scene, time, weather, character_emotions(JSON), relationships(JSON), recent_events(JSON) |
| `story_log` | 故事記錄 | world_id(FK), sequence, speaker_id(FK), type, emotion, image_trigger_context(JSON) |
| `settings` | 應用設定 | key(PRIMARY), value |

JSON 欄位在讀寫時手動序列化/反序列化（非 SQLite JSON 擴展）。

---

## IPC 通道對照表

所有通道常數定義於 `src/main/services/types.ts` 的 `IPC_CHANNELS`。

| 分類 | 通道 | Main Handler | Preload 方法 |
|------|------|-------------|-------------|
| World | `world:create` | `createWorld(config)` | `api.world.create(config)` |
| World | `world:list` | `listWorlds()` | `api.world.list()` |
| World | `world:get` | `getWorld(id)` | `api.world.get(id)` |
| World | `world:update` | `updateWorld(id, updates)` | `api.world.update(id, updates)` |
| World | `world:delete` | `deleteWorld(id)` | `api.world.delete(id)` |
| World | `world:state:get` | `getWorldState(worldId)` | `api.world.getState(worldId)` |
| Character | `character:create` | `createCharacter(...)` | `api.character.create(...)` |
| Character | `character:list` | `listCharacters(worldId)` | `api.character.list(worldId)` |
| Character | `character:update` | `updateCharacter(id, updates)` | `api.character.update(id, updates)` |
| Character | `character:delete` | `deleteCharacter(id)` | `api.character.delete(id)` |
| Character | `character:generate-avatar` | 調用圖片 API + 儲存錨點 | `api.character.generateAvatar(id)` |
| Game | `game:action` | `processGameAction(action)` | `api.game.sendAction(action)` |
| Image | `image:generate-scene` | 調用圖片 API | `api.image.generateScene(prompt)` |
| Settings | `settings:get` | `getSettings()` | `api.settings.get()` |
| Settings | `settings:update` | `updateSettings(updates)` | `api.settings.update(updates)` |
| Story | `story:get-log` | `getStoryLog(worldId, limit, offset)` | `api.story.getLog(worldId)` |
| Story | `story:get-snapshot` | `getWorldState(worldId)` | `api.story.getSnapshot(worldId)` |

---

## 開發指令

```powershell
# 安裝依賴（會自動執行 postinstall：重建 better-sqlite3）
npm install

# 啟動開發模式（HMR + Electron）
npm run dev

# 僅建置（不啟動 Electron）
npm run build

# 打包為 Windows installer
npm run package
```

---

## 已知問題與注意事項

### 建置與執行
1. **electron-vite 5 + Electron 42 不相容**：目前鎖定 Electron 33.4.0。升級 Electron 前需驗證 electron-vite 支援。
2. **better-sqlite3 必須重建**：每次 `npm install` 後 `postinstall` 腳本會自動執行 `electron-rebuild`。若出現 `NODE_MODULE_VERSION` 錯誤，手動執行 `npx @electron/rebuild -m . -o better-sqlite3`。
3. **Vite 版本鎖定在 5.x**：因 electron-vite 5 的 peer dependency 限制。`@vitejs/plugin-react` 需用 v4（支援 Vite 5）。
4. **不支援 uuid 套件**：uuid v10+ 是 ESM-only，與 CommonJS 的 Electron main process 不相容。已改用 `crypto.randomUUID()`。

### 功能限制（v1）
5. **WorldPreviewPage 為 placeholder**：AI 預覽補全世界設定的功能尚未完整實作，目前直接跳轉到遊戲。
6. **API Key 明文儲存**：settings 表中的 API Key 未加密。若需加強安全，可使用 Electron `safeStorage` API。
7. **新角色確認流程簡化**：動態角色在 GamePage 頂部以橫幅顯示確認，未實作專用編輯對話框。
8. **語音功能已完全移除**：本版本不支援任何語音相關功能。
9. **角色關係圖未實作**：計畫中的力導向關係圖（D3/vis.js）尚未整合。
10. **虛擬列表未實作**：長對話記錄未使用虛擬滾動，大量訊息時可能有效能瓶頸。

### 圖片系統
11. **Stability AI API 格式**：使用 v2beta API (`/v2beta/stable-image/generate/core`)，若 API 更新需調整。
12. **圖片檔案管理**：所有生成的圖片儲存在 `userData/images/`，無自動清理機制。
13. **角色頭像 seed 支援**：OpenAI DALL-E 3 不支援 seed 參數（僅 DALL-E 2 支援），視覺錨點的 seed 對 OpenAI 無實際作用。

---

## 程式碼慣例

### 命名規範
- **檔案**：camelCase（`gameStore.ts`），頁面元件 PascalCase（`GamePage.tsx`）
- **函式**：camelCase（`createWorld`、`processGameAction`）
- **型別/介面**：PascalCase（`WorldConfig`、`StructuredLLMOutput`）
- **常數**：UPPER_SNAKE_CASE（`IPC_CHANNELS`、`DEFAULT_SETTINGS`）
- **資料庫欄位**：snake_case（`world_id`、`created_at`）

### 模組組織
- **Main Process** 的服務層採用功能分離：每個 `services/*.ts` 對應一個業務領域
- **Renderer** 採用 pages + stores 分離：頁面負責 UI，store 負責狀態
- **IPC 通道名稱**統一用 `domain:action` 格式（如 `world:create`）
- **型別定義集中在 `services/types.ts`**：所有跨層共享的 interface 都在此檔案

### 錯誤處理
- Main process 的 handler 遇到錯誤直接 throw，Electron 會將錯誤傳遞給 renderer
- Renderer 以 try-catch 包裹 IPC 調用，顯示 `alert()`
- 圖片生成失敗為靜默降級（不中斷遊戲體驗）

### 樣式
- 使用 Tailwind 預設色系 `game-*`（定義於 `tailwind.config.js`）
- 所有顏色使用語意化命名（`game-bg`、`game-panel`、`game-highlight` 等）
- 動畫使用 Tailwind 自定義 keyframes（`fade-in`、`slide-up`、`pulse-soft`）