<template>
  <component :is="selectedLayout">
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import GetOneAPIAuthLayout from '@/getoneapi/layouts/GetOneAPIAuthLayout.vue'
import LegacyAuthLayout from './LegacyAuthLayout.vue'

const appStore = useAppStore()
const selectedLayout = computed(() =>
  appStore.getoneapiUserUIEnabled ? GetOneAPIAuthLayout : LegacyAuthLayout
)
</script>
