
## 🆕 v1.1.0-dev 變更紀錄（2026-05-15）

### 對話模式修復

**問題**：在對話模式下，用戶以括號輸入動作（如「(我回到家了)」），LLM 不會生成 NPC 對話回應。

**根因**：`processGameAction` 中 `isFreeAction` 的判斷包含了 `input.startsWith('(')`，導致任何括號開頭的輸入都被視為自由模式，強制剝離所有 dialogues。

**修復**：
- `isFreeAction` 僅由 `actionType === 'free-action'` 觸發，不再自動檢測括號輸入
- 新增 `parsePlayerInput(input)` 函數，自動從用戶輸入中分離括號動作與非括號對話
- 對話模式下，LLM prompt 明確指示：括號內容為動作、非括號內容為對話，NPC 仍必須回應
- `parseLLMOutput` 僅在真正自由模式時剝離 dialogues
- `buildPrompt` 的用戶訊息格式改為「玩家 {name} - 動作: {...}，對話: {...}」

### 世界初始化（開場敘述）

**問題**：創建世界後進入遊戲，只顯示「The story begins…」靜態文字，無 AI 生成的開場敘述。

**修復**：
- 新增 `generateOpeningNarration(worldId)` 函數，使用 LLM 生成開場敘述
- 新增 IPC 通道 `game:start`（`IPC_CHANNELS.GAME_START`）
- `GamePage.tsx` 首次載入時若無故事條目，自動調用 `window.api.game.start()`

### 角色模板系統（首頁角色列表）

**設計**：角色可在首頁建立為「全局模板」（`world_id = '__global__'`），創建世界時選擇加入。

**新增 API**：
- `character:list-global` — 查詢所有全局角色模板
- `character:assign-world` — 將全局角色分配至指定世界（更新 world_id）

**前端變更**：
- `HomePage.tsx`：新增角色列表區塊，支援 CRUD（建立/編輯/刪除），含角色表單模態框
- `WorldCreatePage.tsx`：新增「從角色模板選取」區塊，顯示全局角色供勾選加入世界

**i18n 新增 Key**：
- `home.characters`, `home.addCharacter`, `home.noCharacters`, `home.noCharactersHint`
- `worldCreate.selectChars`, `worldCreate.selectedChars`, `worldCreate.noGlobalChars`

### GM 面板 i18n

**問題**：GM Panel 全部硬編碼英文，`safeT` 函數僅返回 fallback。

**修復**：
- 引入 `useI18n()`，移除 `safeT` 存根
- 所有字串改用 `t()` 調用
- 新增 i18n keys：`gmPanel.title`, `gmPanel.hint`, `gmPanel.processing`, `gmPanel.placeholder`, `gmPanel.send`, `gmPanel.error`
- 同步更新 zh-TW、en、ja 三語翻譯

### 已知問題更新

- **🔴 嚴重**：無新增
- **🟡 中等**：新增全局角色模板系統（`world_id = '__global__'`），需確保不會與真實世界 ID 衝突
- **🟢 輕微**：`parsePlayerInput` 的 regex 僅匹配中文全形與半形括號，英文括號亦支援

### 已修復 Bugs（本次）

| 檔案 | 問題 | 修復 |
|------|------|------|
| `game.ts` | 對話模式括號動作不觸發 NPC 對話 | 分離 isFreeAction 檢測與括號解析 |
| `game.ts` | 新建世界無開場敘述 | 新增 generateOpeningNarration + game:start |
| `GMPanel.tsx` | 硬編碼英文，無 i18n | 改用 useI18n + 新增翻譯 key |
| `HomePage.tsx` | 無角色管理 | 新增角色模板 CRUD |
| `WorldCreatePage.tsx` | 無法從模板選擇角色 | 新增全局角色選取 UI |
