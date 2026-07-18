<template>
  <GetOneAPIPublicLayout>
    <main class="content flex min-h-screen items-center justify-center p-6 text-center">
      <h1 class="text-4xl font-semibold">{{ appStore.siteName }}</h1>
    </main>
  </GetOneAPIPublicLayout>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores'
import GetOneAPIPublicLayout from '@/getoneapi/layouts/GetOneAPIPublicLayout.vue'

const appStore = useAppStore()
</script>
