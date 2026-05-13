import { ImageOptions, ImageResult } from '../../types'
import { ImageProvider } from './index'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

export class StabilityImageProvider implements ImageProvider {
  constructor(private apiKey: string) {}

  async generate(prompt: string, options: ImageOptions): Promise<ImageResult> {
    const formData = new FormData()
    formData.append('prompt', prompt)
    formData.append('output_format', 'png')

    if (options.seed) {
      formData.append('seed', String(options.seed))
    }

    const size = options.size ?? '1024x1024'
    const stylePreset = options.style ?? 'fantasy-art'

    const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Stability AI error: ${response.status} ${errorText}`)
    }

    const result = (await response.json()) as {
      image: string
      seed: number
      finish_reason: string
    }

    const imagesDir = path.join(app.getPath('userData'), 'images')
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true })
    }

    const filename = `scene_${Date.now()}.png`
    const filePath = path.join(imagesDir, filename)

    const buffer = Buffer.from(result.image, 'base64')
    fs.writeFileSync(filePath, buffer)

    return {
      imagePath: filePath,
      seed: result.seed,
    }
  }
}