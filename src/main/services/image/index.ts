import { ImageOptions, ImageResult } from '../types'

export interface ImageProvider {
  generate(prompt: string, options: ImageOptions): Promise<ImageResult>
}

export { OpenAIImageProvider } from './openai'
export { StabilityImageProvider } from './stability'