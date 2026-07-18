<template>
  <div ref="menuRoot" class="g1-language" @focusout="closeOnFocusOut">
    <button
      ref="triggerButton"
      type="button"
      class="g1-language__trigger"
      data-ui="language-trigger"
      aria-label="Choose language"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      :disabled="switching"
      @click="toggleMenu"
      @keydown.down.prevent="openMenu('first')"
      @keydown.up.prevent="openMenu('last')"
      @keydown.escape="closeMenu(false)"
    >
      <Icon name="globe" size="sm" aria-hidden="true" />
      <span>{{ currentLocale?.name || currentLocaleCode.toUpperCase() }}</span>
      <Icon name="chevronDown" size="xs" aria-hidden="true" />
    </button>

    <div v-if="isOpen" class="g1-language__menu" role="menu" aria-label="Languages">
      <button
        v-for="localeOption in availableLocales"
        :key="localeOption.code"
        type="button"
        role="menuitemradio"
        :aria-checked="localeOption.code === currentLocaleCode"
        :data-locale="localeOption.code"
        :disabled="switching"
        :tabindex="-1"
        ref="optionButtons"
        class="g1-language__option"
        @click="selectLanguage(localeOption.code)"
        @keydown.down.prevent="focusAdjacent(localeOption.code, 1)"
        @keydown.up.prevent="focusAdjacent(localeOption.code, -1)"
        @keydown.home.prevent="focusOption(0)"
        @keydown.end.prevent="focusOption(availableLocales.length - 1)"
        @keydown.escape.prevent="closeMenu(true)"
      >
        <Icon name="globe" size="sm" aria-hidden="true" />
        <span>{{ localeOption.name }}</span>
        <Icon
          v-if="localeOption.code === currentLocaleCode"
          name="check"
          size="sm"
          class="g1-language__check"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { availableLocales, getLocale, setLocale } from '@/i18n'

const currentLocaleCode = ref<string>(getLocale())
const currentLocale = computed(() =>
  availableLocales.find((item) => item.code === currentLocaleCode.value)
)
const isOpen = ref(false)
const switching = ref(false)
const menuRoot = ref<HTMLElement | null>(null)
const triggerButton = ref<HTMLButtonElement | null>(null)
const optionButtons = ref<HTMLButtonElement[]>([])

function closeMenu(restoreFocus: boolean): void {
  isOpen.value = false
  if (restoreFocus) void nextTick(() => triggerButton.value?.focus())
}

function focusOption(index: number): void {
  optionButtons.value[index]?.focus()
}

function openMenu(target: 'current' | 'first' | 'last' = 'current'): void {
  isOpen.value = true
  void nextTick(() => {
    if (target === 'first') return focusOption(0)
    if (target === 'last') return focusOption(availableLocales.length - 1)
    const index = availableLocales.findIndex((item) => item.code === currentLocaleCode.value)
    focusOption(Math.max(index, 0))
  })
}

function toggleMenu(): void {
  if (isOpen.value) closeMenu(false)
  else openMenu()
}

function focusAdjacent(code: string, direction: 1 | -1): void {
  const current = availableLocales.findIndex((item) => item.code === code)
  const next = (current + direction + availableLocales.length) % availableLocales.length
  focusOption(next)
}

async function selectLanguage(code: string): Promise<void> {
  if (switching.value || code === currentLocaleCode.value) {
    closeMenu(true)
    return
  }
  switching.value = true
  try {
    await setLocale(code)
    currentLocaleCode.value = code
    closeMenu(true)
  } finally {
    switching.value = false
  }
}

function closeOnOutsideClick(event: MouseEvent): void {
  if (!menuRoot.value?.contains(event.target as Node)) closeMenu(false)
}

function closeOnFocusOut(event: FocusEvent): void {
  const nextTarget = event.relatedTarget as Node | null
  const returnedToTrigger = event.target !== triggerButton.value && nextTarget === triggerButton.value
  if (returnedToTrigger || !menuRoot.value?.contains(nextTarget)) closeMenu(false)
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutsideClick))
</script>

<style scoped>
.g1-language {
  position: relative;
}

.g1-language__trigger,
.g1-language__option {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.g1-language__trigger {
  min-width: 44px;
  padding-inline: 12px;
  background: var(--g1-surface);
  border: 1px solid var(--g1-divider);
}

.g1-language__menu {
  position: absolute;
  z-index: 30;
  top: calc(100% + 6px);
  right: 0;
  width: 176px;
  padding: 4px;
  border: 1px solid var(--g1-divider);
  border-radius: var(--g1-radius-md);
  background: var(--g1-surface-raised);
  box-shadow: var(--g1-shadow-raised);
}

.g1-language__option {
  width: 100%;
  justify-content: flex-start;
  background: transparent;
  text-align: left;
}

.g1-language__option[aria-checked='true'] {
  background: var(--g1-control);
}

.g1-language__check {
  margin-left: auto;
}
</style>
