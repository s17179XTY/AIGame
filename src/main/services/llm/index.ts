import { LLMMessage, LLMOptions, LLMResponse } from '../types'

export interface LLMProvider {
  chat(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse>
}

export { OpenAIProvider } from './openai'
export { AnthropicProvider } from './anthropic'
export { GeminiProvider } from './gemini'