import { LLMMessage, LLMOptions, LLMResponse, AppSettings } from '../../types'
import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'
import { GeminiProvider } from './gemini'

export interface LLMProvider {
  chat(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse>
}

export function createLLMProvider(settings: AppSettings): LLMProvider {
  switch (settings.llmProvider) {
    case 'openai':
      if (!settings.apiKey) throw new Error('API Key not configured')
      return new OpenAIProvider(settings.apiKey, settings.apiBaseUrl)
    case 'anthropic':
      if (!settings.apiKey) throw new Error('API Key not configured')
      return new AnthropicProvider(settings.apiKey, settings.apiBaseUrl)
    case 'gemini':
      if (!settings.apiKey) throw new Error('API Key not configured')
      return new GeminiProvider(settings.apiKey, settings.llmModel, settings.apiBaseUrl)
    default:
      throw new Error(`Unsupported LLM provider: ${settings.llmProvider}`)
  }
}

export { OpenAIProvider } from './openai'
export { AnthropicProvider } from './anthropic'
export { GeminiProvider } from './gemini'