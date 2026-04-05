export { WavultClient, WavultError } from './client'
export { AuthModule } from './auth'
export { DbModule } from './db'
export { ImagesModule } from './images'
export { StorageModule } from './storage'
export { MessagingModule } from './messaging'
export { WAVULT_CONSTRAINTS } from './constraints'
export type { WavultUser } from './auth'
export type { QueryOptions } from './db'
export type { ImageGenerateOptions, GeneratedImage } from './images'
export type { Severity, ApiResponse, PaginatedResponse, WavultProject } from './types'

import { WavultClient } from './client'
import { AuthModule } from './auth'
import { DbModule } from './db'
import { ImagesModule } from './images'
import { StorageModule } from './storage'
import { MessagingModule } from './messaging'

// Singleton factory
export function createWavult(config?: { apiUrl?: string; token?: string; project?: string }) {
  const client = new WavultClient(config)
  return {
    client,
    auth:      new AuthModule(client),
    db:        new DbModule(client),
    images:    new ImagesModule(client),
    storage:   new StorageModule(client),
    messaging: new MessagingModule(client),
    setToken:  (t: string) => client.setToken(t),
  }
}

// Default instance
export const wavult = createWavult()
