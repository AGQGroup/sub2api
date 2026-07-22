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
  const titleKey = route.meta.titleKey as string | undefined
  if (titleKey) return t(titleKey)
  const title = route.meta.title as string | undefined
  if (title) return title
  return t('common.appName')
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
  gap: var(--g1-space-2);
  padding: 0 clamp(12px, 3vw, 40px);
  border-bottom: 1px solid var(--g1-divider);
  background: var(--g1-surface);
}

.g1-user-header__left {
  display: none;
}

.g1-user-header__center {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: flex-start;
}

.g1-user-header__title {
  margin: 0;
  font-size: var(--g1-text-md);
  font-weight: 700;
  color: var(--g1-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.g1-user-header__right {
  display: flex;
  align-items: center;
  gap: var(--g1-space-1);
  flex-shrink: 0;
}

@media (min-width: 1024px) {
  .g1-user-header__center {
    justify-content: center;
  }
  .g1-user-header__left {
    display: block;
    width: 100px;
  }
  .g1-user-header__right {
    min-width: 100px;
    justify-content: flex-end;
  }
}
</style>
