import OpenAI from 'openai'
import { LLMMessage, LLMOptions, LLMResponse } from '../types'
import { LLMProvider } from './index'

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI | null = null

  constructor(
    private apiKey: string,
    private baseUrl: string = ''
  ) {}

  private getClient(): OpenAI {
    if (!this.client) {
      const opts: any = { apiKey: this.apiKey }
      if (this.baseUrl) {
        opts.baseURL = this.baseUrl
      }
      this.client = new OpenAI(opts)
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
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
    }

    if (isJsonMode) {
      params.response_format = { type: 'json_object' }
    }

    let response: OpenAI.Chat.ChatCompletion
    try {
      response = await client.chat.completions.create(params)
    } catch (err: any) {
      const msg = err?.message ?? err?.toString() ?? 'Unknown error'
      if (this.baseUrl && (this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1') || this.baseUrl.includes('192.168.'))) {
        throw new Error(
          'LLM request failed: ' + msg + '\n\nTip: If using LM Studio, make sure your apiBaseUrl includes /v1 (e.g. http://localhost:1234/v1)'
        )
      }
      const hint = msg.includes('response_format') ? ' (此模型可能不支援 json_object 格式)' : ''
      throw new Error('LLM request failed: ' + msg + hint)
    }

    if (!response || !Array.isArray(response.choices) || response.choices.length === 0) {
      if (this.baseUrl && (this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1') || this.baseUrl.includes('192.168.'))) {
        throw new Error(
          'LLM returned an empty response. This often happens when using a local model server:\n' +
          '- Check that apiBaseUrl includes /v1 (e.g. http://localhost:1234/v1)\n' +
          '- Verify the model name matches exactly what the server expects\n' +
          '- The model may not support json_object response format — try disabling JSON mode'
        )
      }
      throw new Error('LLM returned an empty response. Check your API endpoint and model name.')
    }

    const respContent = response.choices[0]?.message?.content ?? ''

    return {
      text: respContent,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
          }
        : undefined,
    }
  }
}