import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyThemeMode, readThemeMode } from '../useThemeMode'

describe('GetOneAPI theme mode', () => {
  beforeEach(() => localStorage.clear())

  it('treats the legacy dark value as dark', () => {
    localStorage.setItem('theme', 'dark')
    expect(readThemeMode()).toBe('dark')
  })

  it('uses system and follows media changes', () => {
    const addEventListener = vi.fn()
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener, removeEventListener: vi.fn() })))
    const dispose = applyThemeMode('system')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    dispose()
  })
})
