import { WavultClient } from './client'

export class StorageModule {
  constructor(private client: WavultClient) {}

  async upload(file: File | Blob, options: { path: string; bucket?: string }): Promise<{ url: string; key: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', options.path)
    if (options.bucket) formData.append('bucket', options.bucket)
    return this.client.fetch('/api/files/upload', {
      method: 'POST',
      headers: {}, // låt browser sätta Content-Type med boundary
      body: formData
    })
  }

  getUrl(key: string, bucket = 'wavult-images-eu-primary'): string {
    return `https://${bucket}.s3.eu-north-1.amazonaws.com/${key}`
  }
}
