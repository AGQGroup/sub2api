<template>
  <a href="/home" class="g1-brand" aria-label="Home">
    <img
      :src="imageSource"
      :alt="`${siteName} logo`"
      width="40"
      height="40"
      class="g1-brand__logo"
      @error="useFallbackLogo"
    />
    <span class="g1-brand__name">{{ siteName }}</span>
  </a>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { sanitizeUrl } from '@/utils/url'

const props = defineProps<{
  siteName: string
  logoUrl?: string
}>()

const FALLBACK_LOGO = '/logo.png'
const imageSource = ref(resolveLogo(props.logoUrl))

watch(() => props.logoUrl, (value) => {
  imageSource.value = resolveLogo(value)
})

function resolveLogo(value = ''): string {
  return sanitizeUrl(value, { allowRelative: true, allowDataUrl: true }) || FALLBACK_LOGO
}

function useFallbackLogo(): void {
  imageSource.value = FALLBACK_LOGO
}
</script>

<style scoped>
.g1-brand {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: var(--g1-space-3);
  color: var(--g1-text);
  text-decoration: none;
}

.g1-brand__logo {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border: 1px solid var(--g1-divider);
  border-radius: var(--g1-radius-md);
  background: var(--g1-surface);
  object-fit: contain;
}

.g1-brand__name {
  overflow-wrap: anywhere;
  font-size: var(--g1-text-lg);
  font-weight: 650;
  line-height: 1.2;
}
</style>
