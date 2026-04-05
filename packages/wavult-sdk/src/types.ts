// Shared types for @wavult/sdk

export type Severity = 'critical' | 'error' | 'warning' | 'info'

export interface ApiResponse<T> {
  data: T
  error?: string
  status: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface WavultProject {
  id: string
  name: string
  slug: string
  createdAt: string
}
