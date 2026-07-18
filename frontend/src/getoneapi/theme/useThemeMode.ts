import { computed, ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'
const STORAGE_KEY = 'theme'

export function readThemeMode(): ThemeMode {
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

export function applyThemeMode(mode: ThemeMode): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = (dark: boolean) => document.documentElement.classList.toggle('dark', dark)
  apply(mode === 'dark' || (mode === 'system' && media.matches))
  // On later media changes, respect the CURRENT stored mode: legacy toggles write
  // 'dark'/'light' directly to localStorage, and that explicit choice must win.
  const onChange = (event: MediaQueryListEvent) => {
    if (readThemeMode() === 'system') apply(event.matches)
  }
  if (mode === 'system') media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export function useThemeMode() {
  const mode = ref<ThemeMode>(readThemeMode())
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const systemDark = ref(media.matches)
  const isDark = computed(
    () => mode.value === 'dark' || (mode.value === 'system' && systemDark.value)
  )
  const onSystemChange = (event: MediaQueryListEvent) => {
    systemDark.value = event.matches
    if (mode.value === 'system')
      document.documentElement.classList.toggle('dark', event.matches)
  }
  media.addEventListener('change', onSystemChange)
  function setMode(next: ThemeMode) {
    mode.value = next
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.classList.toggle('dark', isDark.value)
  }
  return {
    mode,
    isDark,
    setMode,
    dispose: () => media.removeEventListener('change', onSystemChange)
  }
}
