import OpenAI from 'openai'
import { VoiceConfig, TTSOptions, TTSResult } from '../types'
import { VoiceProvider } from './index'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export class OpenAIVoiceProvider implements VoiceProvider {
  private client: OpenAI
  private config: VoiceConfig

  constructor(config: VoiceConfig) {
    this.config = config
    this.client = new OpenAI({
      apiKey: config.apiKey,
    })
  }

  async tts(options: TTSOptions): Promise<TTSResult> {
    try {
      const model = options.model || this.config.model || 'tts-1'
      const voice = options.voice || this.config.voice || 'alloy'
      const speed = options.speed ?? this.config.speed ?? 1.0

      const response = await this.client.audio.speech.create({
        model,
        voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
        input: options.text,
        speed,
        response_format: 'mp3',
      })

      // Save audio file
      const audioDir = path.join(app.getPath('userData'), 'audio')
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true })
      }

      const fileName = 'tts_' + Date.now() + '.mp3'
      const filePath = path.join(audioDir, fileName)

      const buffer = Buffer.from(await response.arrayBuffer())
      fs.writeFileSync(filePath, buffer)

      return {
        audioPath: filePath,
        format: 'mp3',
      }
    } catch (err: any) {
      const msg = err?.message ?? err?.toString() ?? 'Unknown error'
      throw new Error('TTS request failed: ' + msg)
    }
  }
}
