<template>
  <header class="g1-user-header">
    <div class="g1-user-header__left" />
    <div class="g1-user-header__center">
      <h1 data-ui="user-page-title" class="g1-user-header__title">
        {{ pageTitle }}
      </h1>
    </div>
    <div class="g1-user-header__right">
      <ThemeModeControl />
      <LanguageMenu />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageMenu from '@/getoneapi/components/LanguageMenu.vue'
import ThemeModeControl from '@/getoneapi/components/ThemeModeControl.vue'

const { t } = useI18n()
const route = useRoute()

const pageTitle = computed(() => {
  const title = route.meta.title as string | undefined
  return title || t('common.appName')
})
</script>

<style scoped>
.g1-user-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 clamp(16px, 3vw, 40px);
  border-bottom: 1px solid var(--g1-divider);
  background: var(--g1-surface);
}

.g1-user-header__left {
  width: 100px;
}

.g1-user-header__center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.g1-user-header__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--g1-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.g1-user-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
  justify-content: flex-end;
}
</style>
