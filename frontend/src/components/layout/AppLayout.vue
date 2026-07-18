<template>
  <component :is="selectedLayout" ref="layoutRef">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore, useAuthStore } from '@/stores'
import GetOneAPIUserLayout from '@/getoneapi/layouts/GetOneAPIUserLayout.vue'
import LegacyAppLayout from './LegacyAppLayout.vue'

interface ReplayableLayout {
  replayTour?: () => void
}

const appStore = useAppStore()
const authStore = useAuthStore()
const layoutRef = ref<ReplayableLayout | null>(null)

const selectedLayout = computed(() =>
  appStore.getoneapiUserUIEnabled && !authStore.isAdmin
    ? GetOneAPIUserLayout
    : LegacyAppLayout
)

function replayTour(): void {
  layoutRef.value?.replayTour?.()
}

defineExpose({ replayTour })
</script>
