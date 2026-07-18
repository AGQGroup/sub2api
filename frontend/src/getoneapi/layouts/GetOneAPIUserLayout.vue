<template>
  <div data-surface="getoneapi-user" class="g1-user-layout">
    <div class="g1-user-layout__controls" aria-label="Display preferences">
      <ThemeModeControl />
      <LanguageMenu />
    </div>
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import LanguageMenu from '@/getoneapi/components/LanguageMenu.vue'
import ThemeModeControl from '@/getoneapi/components/ThemeModeControl.vue'
</script>

<style scoped>
.g1-user-layout {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--g1-canvas);
}

.g1-user-layout__controls {
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px clamp(16px, 3vw, 40px);
  border-bottom: 1px solid var(--g1-divider);
  background: var(--g1-surface);
}
</style>
