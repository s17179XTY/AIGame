import { LLMMessage, LLMOptions, LLMResponse, LLMConfig } from '../types'
import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'
import { GeminiProvider } from './gemini'

export interface LLMProvider {
  chat(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse>
}

export function createLLMProvider(config: LLMConfig): LLMProvider {
  switch (config.provider) {
    case 'openai':
      if (!config.apiKey) throw new Error('API Key not configured')
      return new OpenAIProvider(config.apiKey, config.apiBaseUrl)
    case 'anthropic':
      if (!config.apiKey) throw new Error('API Key not configured')
      return new AnthropicProvider(config.apiKey, config.apiBaseUrl)
    case 'gemini':
      if (!config.apiKey) throw new Error('API Key not configured')
      return new GeminiProvider(config.apiKey, config.model, config.apiBaseUrl)
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`)
  }
}

export { OpenAIProvider } from './openai'
export { AnthropicProvider } from './anthropic'
export { GeminiProvider } from './gemini'