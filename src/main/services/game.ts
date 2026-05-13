import { randomUUID } from 'crypto'
import { getDatabase } from '../database'
import {
  World,
  WorldState,
  Character,
  AppSettings,
  LLMMessage,
  StructuredLLMOutput,
  StateUpdate,
  ImageTrigger,
  NewCharacterRequest,
  StoryEntry,
  GameAction,
  GameResponse,
  DialogueEntry,
  RelationshipUpdate,
  ImageContext,
} from './types'
import { getWorld, getWorldState, updateWorldState } from './world'
import { listCharacters, getPlayerCharacter } from './character'
import { getSettings } from './settings'
import { LLMProvider, OpenAIProvider, AnthropicProvider, GeminiProvider } from './llm'

export async function processGameAction(action: GameAction): Promise<GameResponse> {
  const settings = getSettings()
  const world = getWorld(action.worldId)
  if (!world) throw new Error('World not found')

  const worldState = getWorldState(action.worldId)
  if (!worldState) throw new Error('World state not found')

  const characters = listCharacters(action.worldId)
  const player = getPlayerCharacter(action.worldId)
  if (!player) throw new Error('Player character not found')

  // Build the prompt
  const messages = buildPrompt(world, worldState, characters, player, action.playerInput)

  // Call LLM
  const llmProvider = getLLMProvider(settings)
  const response = await llmProvider.chat(messages, {
    model: settings.llmModel,
    temperature: 0.8,
    maxTokens: 4096,
    responseFormat: 'json_object',
  })

  // Parse response
  const output = parseLLMOutput(response.text)

  // Process state updates
  processStateUpdate(action.worldId, worldState, output.stateUpdate, characters)

  // Check for image trigger
  const imageTrigger = evaluateImageTrigger(output.imageTrigger, worldState, settings)

  // Handle new character requests
  const newCharacterRequests = output.newCharacters ?? []

  // Create story entries
  const entries = createStoryEntries(action.worldId, worldState, output, characters, player)

  return {
    entries,
    narration: output.narration,
    stateUpdate: output.stateUpdate,
    imageTrigger,
    newCharacterRequests: newCharacterRequests.length > 0 ? newCharacterRequests : undefined,
  }
}

function buildPrompt(
  world: World,
  worldState: WorldState,
  characters: Character[],
  player: Character,
  playerInput: string
): LLMMessage[] {
  const characterListText = characters
    .map(
      (c) =>
        `- ${c.name} (ID: ${c.id}): ${c.gender}, ${c.age}�? ${c.personality}, 外觀: ${c.appearance}${c.isPlayer ? ' [玩家角色]' : ''}${c.extraPrompt ? ` 補充: ${c.extraPrompt}` : ''}`
    )
    .join('\n')

  const relationshipsText = worldState.relationships
    .map((r) => `- ${r.characterA} �?${r.characterB}: ${r.relation} (${r.description})`)
    .join('\n')

  const recentEventsText = worldState.recentEvents.slice(-10).map((e) => `- ${e}`).join('\n')

  const emotionsText = Object.entries(worldState.characterEmotions)
    .map(([name, emotion]) => `- ${name}: ${emotion}`)
    .join('\n')

  const systemPrompt = `你是一個互動敘事遊戲的 AI 遊戲主持�?(Game Master)�?
## 世界設定
- 世界名稱: ${world.config.name}
- 世界觀: ${world.config.worldview}
- 世界規則: ${world.config.rules}
${world.config.systemPrompt ? `## 系統提示詞\n${world.config.systemPrompt}` : ''}

## 當前狀�?- 場景: ${worldState.scene}
- 時間: ${worldState.time}
- 天氣: ${worldState.weather}

## 角色列表
${characterListText}

## 角色情緒
${emotionsText || '尚無記錄'}

## 角色關係
${relationshipsText || '尚無記錄'}

## 近期事件
${recentEventsText || '尚無記錄'}

## 輸出格式要求
你必須以嚴格�?JSON 格式輸出，結構如下：

\`\`\`json
{
  "narration": "場景敘述、環境描寫、旁白（純文字）",
  "dialogues": [
    {
      "speakerId": "角色ID（必須使用上方角色列表中�?ID，若為玩家則�?${player.id}�?,
      "speakerName": "角色名稱",
      "type": "dialogue | monologue | action",
      "content": "發言或動作內�?,
      "emotion": "情緒描述（如：平靜、憤怒、悲傷、喜悅、緊張等�?
    }
  ],
  "stateUpdate": {
    "sceneChanged": true/false,
    "newScene": "新場景描述（�?sceneChanged �?true 時填寫）",
    "timeAdvanced": "時間推進描述（如：過了兩小時、夜幕降臨）",
    "weatherChanged": true/false,
    "newWeather": "新天氣（�?weatherChanged �?true 時填寫）",
    "emotionUpdates": {"角色�?: "新情�?},
    "relationshipUpdates": [
      {"characterA": "角色A�?, "characterB": "角色B�?, "newRelation": "新關�?, "description": "變化描述"}
    ],
    "newEvents": ["事件描述1", "事件描述2"]
  },
  "imageTrigger": {
    "shouldGenerate": true/false,
    "level": "scene | behavior | none",
    "sceneDescription": "畫面描述（英文，用於圖片生成�?50字以內）",
    "charactersPresent": ["在場角色�?],
    "keyAction": "關鍵動作描述"
  },
  "newCharacters": []
}
\`\`\`

## 重要規則
1. 嚴格使用角色 ID 作為 speakerId
2. 每個回應必須包�?narration 和至少一�?dialogue
3. 對話要生動、自然，反映角色性格與當前情�?4. 場景變化僅在故事確實轉移到新地點時觸�?5. imageTrigger.shouldGenerate 僅在場景或重要行為發生顯著變化時設為 true
6. 若故事自然需要引入新角色，請�?newCharacters 陣列中填寫該角色的完整設�?7. 確保所有輸出一致且連貫，不與既有世界設定矛盾`

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
  ]

  // Add recent story context (last 10 entries for context)
  const db = getDatabase()
  const recentLog = db
    .prepare('SELECT * FROM story_log WHERE world_id = ? ORDER BY sequence DESC LIMIT 10')
    .all(world.id) as Record<string, unknown>[]

  if (recentLog.length > 0) {
    const contextEntries = recentLog.reverse()
    for (const entry of contextEntries) {
      const speakerName = entry.speaker_name
      const content = entry.content
      const type = entry.type
      if (type === 'narration') {
        messages.push({ role: 'assistant', content: `[旁白] ${content}` })
      } else {
        messages.push({
          role: 'assistant',
          content: `[${speakerName}] (${type}): ${content}`,
        })
      }
    }
  }

  // Player input
  messages.push({
    role: 'user',
    content: `玩家 ${player.name} 的動�?對話: ${playerInput}`,
  })

  return messages
}

function parseLLMOutput(text: string): StructuredLLMOutput {
  try {
    // Try to extract JSON from the response
    let jsonStr = text.trim()

    // Remove markdown code blocks if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    const parsed = JSON.parse(jsonStr) as StructuredLLMOutput

    return {
      narration: parsed.narration || '',
      dialogues: Array.isArray(parsed.dialogues) ? parsed.dialogues : [],
      stateUpdate: parsed.stateUpdate || {
        sceneChanged: false,
        timeAdvanced: '',
        weatherChanged: false,
        emotionUpdates: {},
        relationshipUpdates: [],
        newEvents: [],
      },
      imageTrigger: parsed.imageTrigger,
      newCharacters: Array.isArray(parsed.newCharacters) ? parsed.newCharacters : [],
    }
  } catch (e) {
    // Fallback: treat entire response as narration
    return {
      narration: text,
      dialogues: [],
      stateUpdate: {
        sceneChanged: false,
        timeAdvanced: '',
        weatherChanged: false,
        emotionUpdates: {},
        relationshipUpdates: [],
        newEvents: [],
      },
    }
  }
}

function processStateUpdate(
  worldId: string,
  currentState: WorldState,
  update: StateUpdate,
  characters: Character[]
): void {
  const updates: Partial<Omit<WorldState, 'id' | 'worldId' | 'updatedAt'>> = {}

  if (update.sceneChanged && update.newScene) {
    updates.scene = update.newScene
  }
  if (update.timeAdvanced) {
    updates.time = update.timeAdvanced
  }
  if (update.weatherChanged && update.newWeather) {
    updates.weather = update.newWeather
  }

  // Update emotions
  if (update.emotionUpdates && Object.keys(update.emotionUpdates).length > 0) {
    const newEmotions = { ...currentState.characterEmotions, ...update.emotionUpdates }
    updates.characterEmotions = newEmotions
  }

  // Update relationships
  if (update.relationshipUpdates && update.relationshipUpdates.length > 0) {
    const newRelationships = [...currentState.relationships]
    for (const relUpdate of update.relationshipUpdates) {
      const existingIdx = newRelationships.findIndex(
        (r) =>
          (r.characterA === relUpdate.characterA && r.characterB === relUpdate.characterB) ||
          (r.characterA === relUpdate.characterB && r.characterB === relUpdate.characterA)
      )
      if (existingIdx >= 0) {
        newRelationships[existingIdx] = {
          ...newRelationships[existingIdx],
          relation: relUpdate.newRelation,
          description: relUpdate.description,
        }
      } else {
        newRelationships.push({
          characterA: relUpdate.characterA,
          characterB: relUpdate.characterB,
          relation: relUpdate.newRelation,
          description: relUpdate.description,
        })
      }
    }
    updates.relationships = newRelationships
  }

  // Update events
  if (update.newEvents && update.newEvents.length > 0) {
    const allEvents = [...currentState.recentEvents, ...update.newEvents]
    updates.recentEvents = allEvents.slice(-30)
  }

  updateWorldState(worldId, updates)
}

function evaluateImageTrigger(
  trigger: ImageTrigger | undefined,
  currentState: WorldState,
  settings: AppSettings
): ImageTrigger | undefined {
  if (!trigger || settings.imageProvider === 'none') return undefined

  if (settings.imageFrequency === 'conservative') {
    // Only scene-level changes trigger
    if (trigger.level !== 'scene' || !trigger.shouldGenerate) {
      return { ...trigger, shouldGenerate: false, level: 'none' }
    }
  } else if (settings.imageFrequency === 'rich') {
    // Allow behavior-level too
    if (!trigger.shouldGenerate) return undefined
  } else {
    // Standard: scene and significant behavior
    if (trigger.level === 'none' || !trigger.shouldGenerate) return undefined
  }

  return trigger
}

function createStoryEntries(
  worldId: string,
  worldState: WorldState,
  output: StructuredLLMOutput,
  characters: Character[],
  player: Character
): StoryEntry[] {
  const db = getDatabase()

  // Get next sequence number
  const maxSeq = db
    .prepare('SELECT COALESCE(MAX(sequence), 0) as max_seq FROM story_log WHERE world_id = ?')
    .get(worldId) as { max_seq: number }
  let seq = maxSeq.max_seq

  const entries: StoryEntry[] = []
  const now = new Date().toISOString()

  // Add narration entry
  if (output.narration) {
    seq++
    const narrationEntry: StoryEntry = {
      id: randomUUID(),
      worldId,
      sequence: seq,
      speakerId: null,
      speakerName: '旁白',
      content: output.narration,
      type: 'narration',
      emotion: '',
      imageTriggerContext: null,
      imagePath: null,
      createdAt: now,
    }

    db.prepare(
      `INSERT INTO story_log (id, world_id, sequence, speaker_id, speaker_name, content, type, emotion, image_trigger_context, image_path, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      narrationEntry.id,
      narrationEntry.worldId,
      narrationEntry.sequence,
      narrationEntry.speakerId,
      narrationEntry.speakerName,
      narrationEntry.content,
      narrationEntry.type,
      narrationEntry.emotion,
      null,
      null,
      narrationEntry.createdAt
    )

    entries.push(narrationEntry)
  }

  // Add dialogue entries
  for (const dialogue of output.dialogues) {
    seq++
    const character = characters.find((c) => c.id === dialogue.speakerId)

    const imageContext: ImageContext | null = output.imageTrigger?.shouldGenerate
      ? {
          sceneDescription: output.imageTrigger.sceneDescription,
          charactersPresent: output.imageTrigger.charactersPresent,
          weather: worldState.weather,
          time: worldState.time,
          keyAction: output.imageTrigger.keyAction,
        }
      : null

    const entry: StoryEntry = {
      id: randomUUID(),
      worldId,
      sequence: seq,
      speakerId: dialogue.speakerId,
      speakerName: dialogue.speakerName,
      content: dialogue.content,
      type: dialogue.type,
      emotion: dialogue.emotion,
      imageTriggerContext: imageContext,
      imagePath: null,
      createdAt: now,
    }

    db.prepare(
      `INSERT INTO story_log (id, world_id, sequence, speaker_id, speaker_name, content, type, emotion, image_trigger_context, image_path, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      entry.id,
      entry.worldId,
      entry.sequence,
      entry.speakerId,
      entry.speakerName,
      entry.content,
      entry.type,
      entry.emotion,
      imageContext ? JSON.stringify(imageContext) : null,
      null,
      entry.createdAt
    )

    entries.push(entry)
  }

  return entries
}

function getLLMProvider(settings: AppSettings): LLMProvider {
  if (!settings.apiKey) throw new Error('API key not configured')
  const baseUrl = settings.apiBaseUrl || undefined
  switch (settings.llmProvider) {
    case 'openai':
      return new OpenAIProvider(settings.apiKey, baseUrl)
    case 'anthropic':
      return new AnthropicProvider(settings.apiKey, baseUrl)
    case 'gemini':
      return new GeminiProvider(settings.apiKey, settings.llmModel, baseUrl)
    default:
      throw new Error(`Unsupported LLM provider: ${settings.llmProvider}`)
  }
}

export function getStoryLog(
  worldId: string,
  limit: number = 100,
  offset: number = 0
): StoryEntry[] {
  const db = getDatabase()
  const rows = db
    .prepare('SELECT * FROM story_log WHERE world_id = ? ORDER BY sequence ASC LIMIT ? OFFSET ?')
    .all(worldId, limit, offset) as Record<string, unknown>[]

  return rows.map((row) => ({
    id: row.id as string,
    worldId: row.world_id as string,
    sequence: row.sequence as number,
    speakerId: row.speaker_id as string | null,
    speakerName: row.speaker_name as string,
    content: row.content as string,
    type: row.type as StoryEntry['type'],
    emotion: row.emotion as string,
    imageTriggerContext: row.image_trigger_context
      ? (JSON.parse(row.image_trigger_context as string) as ImageContext)
      : null,
    imagePath: row.image_path as string | null,
    createdAt: row.created_at as string,
  }))
}