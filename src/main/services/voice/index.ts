import { VoiceConfig, TTSOptions, TTSResult } from '../types'

export interface VoiceProvider {
  tts(options: TTSOptions): Promise<TTSResult>
}

export function createVoiceProvider(config: VoiceConfig): VoiceProvider {
  if (config.provider === 'openai') {
    // Lazy import to avoid bundling issues
    const { OpenAIVoiceProvider } = require('./openai')
    return new OpenAIVoiceProvider(config)
  }
  throw new Error('Unsupported voice provider: ' + config.provider)
}
