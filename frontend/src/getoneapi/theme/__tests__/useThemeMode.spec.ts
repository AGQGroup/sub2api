import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyThemeMode, readThemeMode } from '../useThemeMode'

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<(event: { matches: boolean }) => void>()
  const addEventListener = vi.fn((_type: string, listener: (event: { matches: boolean }) => void) =>
    listeners.add(listener)
  )
  const removeEventListener = vi.fn((_type: string, listener: (event: { matches: boolean }) => void) =>
    listeners.delete(listener)
  )
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches, addEventListener, removeEventListener })))
  return {
    addEventListener,
    removeEventListener,
    fireChange: (next: boolean) => listeners.forEach((listener) => listener({ matches: next }))
  }
}

describe('GetOneAPI theme mode', () => {
  beforeEach(() => localStorage.clear())

  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.classList.remove('dark')
  })

  it('treats the legacy dark value as dark', () => {
    localStorage.setItem('theme', 'dark')
    expect(readThemeMode()).toBe('dark')
  })

  it('uses system and follows media changes', () => {
    const media = stubMatchMedia(true)
    const dispose = applyThemeMode('system')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(media.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    dispose()
  })

  it('does not override an explicit legacy choice on system media changes', () => {
    const media = stubMatchMedia(true)
    applyThemeMode('system')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    // Legacy toggles write 'dark'/'light' directly and manage the class themselves.
    localStorage.setItem('theme', 'light')
    document.documentElement.classList.remove('dark')

    media.fireChange(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('keeps following system changes while the stored mode is system', () => {
    const media = stubMatchMedia(false)
    applyThemeMode('system')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    media.fireChange(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('dispose removes the media change listener', () => {
    const media = stubMatchMedia(true)
    const dispose = applyThemeMode('system')
    dispose()
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    document.documentElement.classList.remove('dark')
    media.fireChange(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
