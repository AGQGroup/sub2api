<template>
  <nav
    class="g1-bottom-nav lg:hidden"
    data-ui="user-bottom-nav"
    aria-label="Mobile navigation"
    :style="{ paddingBottom: `calc(8px + env(safe-area-inset-bottom, 0px))` }"
  >
    <template v-for="item in coreUserNavigation" :key="item.path">
      <router-link
        :to="item.path"
        class="g1-bottom-nav__link"
        :class="{ 'g1-bottom-nav__link--active': isActive(item.path) }"
        :data-ui="'bottom-nav-item'"
        :aria-label="t(item.labelKey)"
        :aria-current="isActive(item.path) ? 'page' : undefined"
      >
        <Icon :name="item.icon" size="md" aria-hidden="true" />
        <span class="g1-bottom-nav__label">{{ t(item.labelKey) }}</span>
      </router-link>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { coreUserNavigation } from './items'

const { t } = useI18n()
const route = useRoute()

function isActive(path: string): boolean {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.g1-bottom-nav {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 30;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid var(--g1-divider);
  background: var(--g1-surface);
}

.g1-bottom-nav__link {
  display: flex;
  min-height: 56px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
  color: var(--g1-text-secondary);
  text-decoration: none;
  transition: color 150ms ease;
}

.g1-bottom-nav__link--active {
  color: var(--g1-primary);
}

.g1-bottom-nav__label {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
}
</style>
