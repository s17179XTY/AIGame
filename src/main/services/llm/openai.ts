import OpenAI from 'openai'
import { LLMMessage, LLMOptions, LLMResponse } from '../../types'
import { LLMProvider } from './index'

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI | null = null

  constructor(private apiKey: string) {}

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({ apiKey: this.apiKey })
    }
    return this.client
  }

  async chat(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse> {
    const client = this.getClient()

    const isJsonMode = options.responseFormat === 'json_object'

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      model: options.model,
      messages: messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens ?? 4096,
    }

    if (isJsonMode) {
      params.response_format = { type: 'json_object' }
    }

    const response = await client.chat.completions.create(params)

    const content = response.choices[0]?.message?.content ?? ''

    return {
      text: content,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
          }
        : undefined,
    }
  }
}