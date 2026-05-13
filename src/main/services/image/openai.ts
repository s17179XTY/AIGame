import OpenAI from 'openai'
import { ImageOptions, ImageResult } from '../../types'
import { ImageProvider } from './index'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import https from 'https'

export class OpenAIImageProvider implements ImageProvider {
  private client: OpenAI | null = null

  constructor(private apiKey: string) {}

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({ apiKey: this.apiKey })
    }
    return this.client
  }

  async generate(prompt: string, options: ImageOptions): Promise<ImageResult> {
    const client = this.getClient()

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: (options.size as '1024x1024' | '1792x1024' | '1024x1792') ?? '1024x1024',
      quality: (options.quality as 'standard' | 'hd') ?? 'standard',
    })

    const imageUrl = response.data[0]?.url
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    const imagePath = await this.downloadImage(imageUrl)

    return {
      imagePath,
      revisedPrompt: response.data[0]?.revised_prompt ?? undefined,
    }
  }

  private downloadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const imagesDir = path.join(app.getPath('userData'), 'images')
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true })
      }

      const filename = `scene_${Date.now()}.png`
      const filePath = path.join(imagesDir, filename)
      const file = fs.createWriteStream(filePath)

      https.get(url, (response) => {
        response.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve(filePath)
        })
      }).on('error', (err) => {
        fs.unlink(filePath, () => {})
        reject(err)
      })
    })
  }
}