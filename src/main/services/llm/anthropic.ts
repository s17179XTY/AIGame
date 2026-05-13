import Anthropic from '@anthropic-ai/sdk'
import { LLMMessage, LLMOptions, LLMResponse } from '../../types'
import { LLMProvider } from './index'

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic | null = null

  constructor(private apiKey: string) {}

  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({ apiKey: this.apiKey })
    }
    return this.client
  }

  async chat(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse> {
    const client = this.getClient()

    const systemMessages = messages.filter((m) => m.role === 'system')
    const conversationMessages = messages.filter((m) => m.role !== 'system')

    const systemPrompt = systemMessages.map((m) => m.content).join('\n\n')

    const response = await client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.8,
      system: systemPrompt || undefined,
      messages: conversationMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const textContent = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')

    return {
      text: textContent,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
      },
    }
  }
}