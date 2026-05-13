import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { LLMMessage, LLMOptions, LLMResponse } from '../../types'
import { LLMProvider } from './index'

export class GeminiProvider implements LLMProvider {
  private model: GenerativeModel | null = null

  constructor(
    private apiKey: string,
    private modelName: string = 'gemini-pro'
  ) {}

  private getModel(): GenerativeModel {
    if (!this.model) {
      const genAI = new GoogleGenerativeAI(this.apiKey)
      this.model = genAI.getGenerativeModel({ model: this.modelName })
    }
    return this.model
  }

  async chat(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse> {
    const model = this.getModel()
    const modelWithOptions = this.modelName !== options.model
      ? new GoogleGenerativeAI(this.apiKey).getGenerativeModel({ model: options.model })
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