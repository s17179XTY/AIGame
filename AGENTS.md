# AI Novel Game - AGENTS.md

## Overview

AI Novel Game is an Electron desktop application for AI-driven interactive storytelling. Users create fully customizable fictional worlds, interact via text input, and experience AI-generated plots, dialogue, character evolution, and world changes.

- **Type**: Standalone Electron desktop app
- **Language**: TypeScript (full-stack)
- **UI Language**: English (code), Traditional Chinese (game content)
- **Current Version**: 1.0.0
- **GitHub**: https://github.com/s17179XTY/AIGame

---

## Tech Stack

| Layer | Technology | Purpose |
|------|------|------|
| Desktop Framework | Electron 33 | Window management, system integration |
| Build Tool | electron-vite 5 + Vite 5 | Three-target bundling (main / preload / renderer) |
| Frontend | React 18 + TypeScript | UI rendering |
| Styling | Tailwind CSS 3 | Dark game-theme UI with custom `game-*` colors |
| State Management | Zustand 5 | Frontend global state |
| Database | better-sqlite3 12 | Local SQLite, WAL mode, stored at `userData/aigame.db` |
| LLM SDKs | openai / @anthropic-ai/sdk / @google/generative-ai | Multi-provider AI integration |
| Native Rebuild | @electron/rebuild 4 | Rebuilds better-sqlite3 for Electron's Node version |
| Packaging | electron-builder 26 | Windows NSIS installer |

---

## Architecture: Electron Three-Layer Model

```
Renderer (React)
  src/renderer/
    Pages:  HomePage, SettingsPage, WorldCreatePage, GamePage, StoryLogPage
    Stores: appStore (routing), settingsStore, gameStore
    |
    |  window.api.*  (contextBridge)
    |
Preload
  src/preload/index.ts
    Exposes: api.world.* / api.character.* / api.game.* / api.image.* / api.settings.* / api.story.*
    |
    |  ipcMain.handle(...)
    |
Main Process
  src/main/
    index.ts       - BrowserWindow creation, lifecycle
    database.ts    - SQLite init, schema migration (5 tables)
    ipc-handlers.ts - All IPC route registration
    services/
      types.ts     - ALL shared interfaces (the project's type backbone)
      world.ts     - World CRUD + WorldState management
      character.ts - Character CRUD + visual anchors
      game.ts      - Game engine (Prompt assembly -> LLM -> Parse -> State update)
      settings.ts  - Settings read/write + testLLMConnection
      llm/         - LLMProvider interface + 3 implementations + createLLMProvider factory
      image/       - ImageProvider interface + DALL-E + Stability AI
```

**Security**: `contextIsolation: true`, `nodeIntegration: false`. Renderer only communicates via preload IPC. API keys stored in SQLite `settings` table.

---

## Directory Structure

```
AIGame/
  package.json                  # Scripts: dev / build / preview / package / postinstall
  electron.vite.config.ts       # Three-target electron-vite config
  tsconfig.json / .node / .web   # TypeScript configs
  tailwind.config.js            # Custom game-* color theme, animations
  postcss.config.js
  electron-builder.yml          # Windows NSIS packaging
  src/
    main/
      index.ts                  # Entry: BrowserWindow, lifecycle
      database.ts               # SQLite: 5 tables, WAL, foreign keys
      ipc-handlers.ts           # All ipcMain.handle registrations
      services/
        types.ts                # ALL type definitions (THE source of truth)
        world.ts                # World CRUD + WorldState management
        character.ts            # Character CRUD + visual anchors
        game.ts                 # Game engine (prompt -> LLM -> parse -> state)
        settings.ts             # Settings + testLLMConnection()
        llm/
          index.ts              # LLMProvider interface + createLLMProvider()
          openai.ts             # OpenAI (GPT-4o, JSON mode, baseUrl support)
          anthropic.ts          # Anthropic (Claude, baseUrl support)
          gemini.ts             # Google Gemini
        image/
          index.ts              # ImageProvider interface
          openai.ts             # DALL-E 3 (downloads image, no seed support)
          stability.ts          # Stability AI (v2beta, seed support)
    preload/
      index.ts                  # contextBridge: window.api.*
    renderer/
      index.html                # Entry HTML
      src/
        main.tsx                # ReactDOM.createRoot
        App.tsx                 # Simple page switch (no router)
        env.d.ts                # window.api type declaration
        index.css               # Tailwind directives + global styles
        stores/
          appStore.ts           # currentPage, selectedWorldId
          settingsStore.ts      # Settings from main process
          gameStore.ts          # Story entries, world state, images
        pages/
          HomePage.tsx          # World list, enter/delete
          SettingsPage.tsx      # API config, test connection, image prefs
          WorldCreatePage.tsx   # World + player + NPC creation form
          WorldPreviewPage.tsx  # AI preview (v1 placeholder)
          GamePage.tsx          # Core game: left chat + right scene
          StoryLogPage.tsx      # Timeline story log
    out/                        # Build output (gitignored)
```

---

## Key Concepts

### AppSettings (Unified API Key)

Settings use a **single `apiKey`** field for all LLM providers, plus an optional `apiBaseUrl` for custom endpoints:

```typescript
interface AppSettings {
  llmProvider: 'openai' | 'anthropic' | 'gemini'
  llmModel: string
  apiKey: string           // Unified API key for all LLM providers
  apiBaseUrl: string        // Optional custom endpoint URL
  imageProvider: 'openai' | 'stability' | 'none'
  imageModel: string
  stabilityApiKey: string   // Separate key for Stability AI images
  imageFrequency: 'conservative' | 'standard' | 'rich'
}
```

### createLLMProvider() Factory

Located in `src/main/services/llm/index.ts`, this factory creates the correct provider based on settings:

```typescript
function createLLMProvider(settings: AppSettings): LLMProvider {
  switch (settings.llmProvider) {
    case 'openai': return new OpenAIProvider(settings.apiKey, settings.apiBaseUrl)
    case 'anthropic': return new AnthropicProvider(settings.apiKey, settings.apiBaseUrl)
    case 'gemini': return new GeminiProvider(settings.apiKey, settings.llmModel, settings.apiBaseUrl)
  }
}
```

### testLLMConnection()

Located in `src/main/services/settings.ts`. Uses **dynamic import()** to load SDKs on-demand (avoids loading unused SDKs). Tests connection with a minimal request. Returns `{ success: boolean, message: string }`.

- OpenAI: gpt-4o-mini fallback
- Anthropic: claude-3-haiku fallback
- Gemini: gemini-2.0-flash-lite fallback

### Game Engine Flow (game.ts -> processGameAction)

1. **Prompt Assembly**: World config + world state (scene/time/weather/emotions/relationships/events) + last 10 story entries + player input
2. **LLM Call**: Via `createLLMProvider(settings)`, requesting JSON format output
3. **Response Parsing**: Extract narration, dialogues, stateUpdate, imageTrigger, newCharacters from JSON
4. **State Update**: Merge emotion changes, relationship updates, new events into world_state
5. **Image Trigger Evaluation**: Filter by frequency preference (conservative/standard/rich)
6. **Story Logging**: All narration and dialogues written to story_log table

### Image System

- **Three-level trigger**: scene (location change) > behavior (significant action) > none (pure dialogue)
- **Frequency prefs**: conservative (scene only) / standard (scene + major actions) / rich (more triggers)
- **Async pipeline**: Text displays immediately, right panel shows generating placeholder, image fades in when ready
- **Manual trigger**: Click camera button or icon next to message
- **Visual anchors**: Store seed, prompt template, last image path for character consistency
- **Note**: DALL-E 3 does NOT support seed (only DALL-E 2 does)

---

## Database Schema

All tables in `userData/aigame.db`, WAL mode, foreign keys enabled.

| Table | Purpose | Key Columns |
|------|------|------|
| `worlds` | World definitions | id, name, config(JSON) |
| `characters` | Characters | world_id(FK), is_player, is_dynamic, is_locked, visual_anchor(JSON) |
| `world_state` | Live world state | world_id(UNIQUE FK), scene, time, weather, character_emotions(JSON), relationships(JSON), recent_events(JSON) |
| `story_log` | Story entries | world_id(FK), sequence, speaker_id(FK), type, emotion, image_trigger_context(JSON) |
| `settings` | App settings | key(PRIMARY), value |

JSON columns are manually serialized/deserialized (no SQLite JSON extension used).

---

## IPC Channel Map

All channel constants in `types.ts`'s `IPC_CHANNELS`.

| Category | Channel | Preload Method |
|------|------|------|
| World | `world:create` | `api.world.create(config)` |
| World | `world:list` | `api.world.list()` |
| World | `world:get` | `api.world.get(id)` |
| World | `world:update` | `api.world.update(id, updates)` |
| World | `world:delete` | `api.world.delete(id)` |
| World | `world:state:get` | `api.world.getState(worldId)` |
| Character | `character:create` | `api.character.create(...)` |
| Character | `character:list` | `api.character.list(worldId)` |
| Character | `character:update` | `api.character.update(id, updates)` |
| Character | `character:delete` | `api.character.delete(id)` |
| Character | `character:generate-avatar` | `api.character.generateAvatar(id)` |
| Game | `game:action` | `api.game.sendAction(action)` |
| Image | `image:generate-scene` | `api.image.generateScene(prompt)` |
| Settings | `settings:test-llm` | `api.settings.testLLM(provider, key, model, url?)` |
| Settings | `settings:get` | `api.settings.get()` |
| Settings | `settings:update` | `api.settings.update(updates)` |
| Story | `story:get-log` | `api.story.getLog(worldId)` |
| Story | `story:get-snapshot` | `api.story.getSnapshot(worldId)` |

---

## Dev Commands

```powershell
npm install        # Install deps + auto-rebuild better-sqlite3 (postinstall)
npm run dev        # Dev mode with HMR
npm run build      # Production build only
npm run package    # Package Windows installer
```

---

## Known Issues

### Build & Runtime
1. **Electron version locked at 33**: electron-vite 5 is incompatible with Electron 42+. Must verify compatibility before upgrading.
2. **better-sqlite3 rebuild required**: postinstall script runs `electron-rebuild`. If NODE_MODULE_VERSION errors occur, run manually: `npx @electron/rebuild -m . -o better-sqlite3`
3. **Vite pinned at 5.x**: electron-vite 5 peer dependency constraint. @vitejs/plugin-react must be v4.
4. **PowerShell encoding corruption**: NEVER use PowerShell string manipulation (Get-Content -Raw + replace + Set-Content) on files containing multi-byte characters. Always use Node.js (fs.readFileSync + fs.writeFileSync with 'utf8') for file edits with CJK characters.

### Feature Limitations (v1)
5. **WorldPreviewPage is placeholder**: AI preview/auto-fill for world settings is not yet implemented
6. **API keys stored in plaintext** in settings table
7. **Character relationship graph** (force-directed) not implemented
8. **Virtual scrolling** not implemented for long chat history
9. **Voice features** completely removed for this version
10. **SettingsPage uses English UI**: Switched from Chinese to avoid UTF-8 corruption from PowerShell

### Image System
11. **DALL-E 3 does not support seed**: Visual anchor seeds only work with Stability AI
12. **Stability AI API**: Uses v2beta endpoint, may need updates
13. **No image cleanup**: Generated images accumulate in userData/images/

---

## Coding Conventions

### Naming
- Files: camelCase (`gameStore.ts`), page components PascalCase (`GamePage.tsx`)
- Functions: camelCase (`createWorld`, `processGameAction`)
- Types/Interfaces: PascalCase (`WorldConfig`, `StructuredLLMOutput`)
- Constants: UPPER_SNAKE_CASE (`IPC_CHANNELS`, `DEFAULT_SETTINGS`)
- DB columns: snake_case (`world_id`, `created_at`)

### Module Organization
- `services/types.ts` is the single source of truth for ALL shared types
- Main process services are feature-separated (one file per domain)
- Renderer uses pages + stores separation
- IPC channels follow `domain:action` naming (`world:create`)

### Error Handling
- Main process handlers throw errors, Electron propagates to renderer
- Renderer wraps IPC calls in try-catch, shows alert()
- Image generation failures are silent degradation

### File Editing Safety
- **CRITICAL**: When editing files with Chinese/CJK characters, always use Node.js `fs.readFileSync/fs.writeFileSync` with `'utf8'` encoding
- PowerShell's `Get-Content -Raw` + `Set-Content` can corrupt multi-byte UTF-8
- For simple ASCII-only files (preload, configs), PowerShell is safe
