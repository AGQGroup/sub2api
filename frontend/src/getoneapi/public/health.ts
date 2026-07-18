export async function getPublicHealth(signal?: AbortSignal): Promise<'operational' | 'unknown'> {
  try {
    const response = await fetch('/health', { cache: 'no-store', signal })
    if (!response.ok) return 'unknown'
    const body = await response.json() as { status?: string }
    return body.status === 'ok' ? 'operational' : 'unknown'
  } catch {
    return 'unknown'
  }
}
