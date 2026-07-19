export type SurfaceErrorState = 'forbidden' | 'rate-limited' | 'maintenance' | 'error'

export function resolveSurfaceError(error: unknown): SurfaceErrorState {
  if (error == null) return 'error'
  const value = error as { status?: number; code?: string }
  if (value.status === 403) return 'forbidden'
  if (value.status === 429) return 'rate-limited'
  if (value.code === 'MAINTENANCE' || value.code === 'SERVICE_UNAVAILABLE') return 'maintenance'
  return 'error'
}
