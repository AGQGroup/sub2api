<template>
  <component :is="selectedHome" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import PublicHomePage from '@/getoneapi/pages/PublicHomePage.vue'
import LegacyHomeView from './LegacyHomeView.vue'

const appStore = useAppStore()
const selectedHome = computed(() =>
  appStore.getoneapiUserUIEnabled ? PublicHomePage : LegacyHomeView
)
</script>
