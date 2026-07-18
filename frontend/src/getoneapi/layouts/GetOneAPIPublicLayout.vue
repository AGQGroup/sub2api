<template>
  <div data-surface="getoneapi-public" class="g1-public-layout">
    <PageHeader />
    <slot />
  </div>
</template>

<script setup lang="ts">
import PageHeader from '@/getoneapi/components/PageHeader.vue'
</script>

<style scoped>
.g1-public-layout {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--g1-canvas);
}
</style>
