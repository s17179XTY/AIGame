import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { LLMMessage, LLMOptions, LLMResponse } from '../../types'
import { LLMProvider } from './index'

export class GeminiProvider implements LLMProvider {
  private model: GenerativeModel | null = null

  constructor(
    private apiKey: string,
    private modelName: string = 'gemini-pro',
    private baseUrl?: string
  ) {}

  private getModel(): GenerativeModel {
    if (!this.model) {
      const genAI = new GoogleGenerativeAI(this.apiKey, this.baseUrl ? { baseUrl: this.baseUrl } : undefined)
      this.model = genAI.getGenerativeModel({ model: this.modelName })
    }
    return this.model
  }

  async chat(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse> {
    const model = this.getModel()

    const generationConfig: Record<string, unknown> = {}
    if (options.temperature !== undefined) generationConfig.temperature = options.temperature
    if (options.maxTokens !== undefined) generationConfig.maxOutputTokens = options.maxTokens
    if (options.responseFormat === 'json_object') generationConfig.responseMimeType = 'application/json'

    const configObj: Record<string, unknown> = { model: options.model }
    if (Object.keys(generationConfig).length > 0) {
      configObj.generationConfig = generationConfig
    }

    const modelWithOptions = this.modelName !== options.model || Object.keys(generationConfig).length > 0
      ? new GoogleGenerativeAI(this.apiKey, this.baseUrl ? { baseUrl: this.baseUrl } : undefined).getGenerativeModel(configObj as any)
      : model

    const systemMessages = messages.filter((m) => m.role === 'system')
    const conversationMessages = messages.filter((m) => m.role !== 'system')

    const systemPrompt = systemMessages.map((m) => m.content).join('\n\n')

    const history = conversationMessages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const lastMessage = conversationMessages[conversationMessages.length - 1]

    const chat = modelWithOptions.startChat({
      history: history.length > 0 ? history : undefined,
      systemInstruction: systemPrompt || undefined,
    })

    const result = await chat.sendMessage(lastMessage?.content ?? '')
    const text = result.response.text()

    return {
      text,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
      },
    }
  }
}
