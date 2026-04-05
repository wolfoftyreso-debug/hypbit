import { WavultClient } from './client'

export interface ImageGenerateOptions {
  prompt: string
  model?: 'dall-e-3' | 'dall-e-2'
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  project?: string
  save_to_s3?: boolean
}

export interface GeneratedImage {
  id: string
  images: Array<{ url?: string; revised_prompt?: string }>
  s3_urls?: string[]
  usage: { cost_usd: number; model: string }
}

export class ImagesModule {
  constructor(private client: WavultClient) {}

  async generate(options: ImageGenerateOptions): Promise<GeneratedImage> {
    return this.client.fetch('/api/images/generate', {
      method: 'POST',
      body: JSON.stringify({ ...options, project: options.project ?? this.client.project })
    })
  }

  async batch(prompts: string[], options?: Omit<ImageGenerateOptions, 'prompt'>): Promise<{ batch_id: string }> {
    return this.client.fetch('/api/images/batch', {
      method: 'POST',
      body: JSON.stringify({ prompts, ...options, project: options?.project ?? this.client.project })
    })
  }
}
