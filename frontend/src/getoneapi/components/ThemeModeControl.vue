<template>
  <div
    class="g1-theme-control"
    role="radiogroup"
    aria-label="Appearance"
  >
    <button
      v-for="option in options"
      :key="option.mode"
      type="button"
      role="radio"
      :aria-checked="mode === option.mode"
      :aria-label="option.label"
      :title="option.label"
      :data-theme-mode="option.mode"
      :tabindex="mode === option.mode ? 0 : -1"
      ref="modeButtons"
      class="g1-theme-control__button"
      @click="setMode(option.mode)"
      @keydown="selectAdjacent($event, option.mode)"
    >
      <Icon :name="option.icon" size="sm" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { useThemeMode, type ThemeMode } from '@/getoneapi/theme/useThemeMode'

const options = [
  { mode: 'light', label: 'Light appearance', icon: 'sun' },
  { mode: 'dark', label: 'Dark appearance', icon: 'moon' },
  { mode: 'system', label: 'System appearance', icon: 'cog' },
] as const

const { mode, setMode, dispose } = useThemeMode()
const modeButtons = ref<HTMLButtonElement[]>([])

function selectAdjacent(event: KeyboardEvent, current: ThemeMode): void {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const currentIndex = options.findIndex((option) => option.mode === current)
  let nextIndex = currentIndex
  if (['ArrowRight', 'ArrowDown'].includes(event.key)) nextIndex = (currentIndex + 1) % options.length
  if (['ArrowLeft', 'ArrowUp'].includes(event.key)) {
    nextIndex = (currentIndex - 1 + options.length) % options.length
  }
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = options.length - 1
  setMode(options[nextIndex].mode)
  void nextTick(() => modeButtons.value[nextIndex]?.focus())
}

onBeforeUnmount(dispose)
</script>

<style scoped>
.g1-theme-control {
  display: inline-grid;
  grid-template-columns: repeat(3, 44px);
  padding: 2px;
  border: 1px solid var(--g1-divider);
  border-radius: var(--g1-radius-md);
  background: var(--g1-surface);
}

.g1-theme-control__button {
  width: 44px;
  min-height: 44px;
  padding: 0;
  border-radius: var(--g1-radius-sm);
  background: transparent;
  color: var(--g1-text-secondary);
}

.g1-theme-control__button[aria-checked='true'] {
  background: var(--g1-control);
  color: var(--g1-text);
}
</style>
