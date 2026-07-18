import { apiClient } from '@/api/client'
import type { PublicCatalog } from './types'

export async function getPublicCatalog(options: { signal?: AbortSignal } = {}): Promise<PublicCatalog> {
  const { data } = await apiClient.get<PublicCatalog>('/catalog/public', { signal: options.signal })
  return data
}
