<template>
  <nav
    class="g1-bottom-nav lg:hidden"
    data-ui="user-bottom-nav"
    aria-label="Mobile navigation"
    :style="{ gridTemplateColumns: `repeat(${visibleNav.length}, 1fr)`, paddingBottom: `calc(8px + env(safe-area-inset-bottom, 0px))` }"
  >
    <router-link
      v-for="item in visibleNav"
      :key="item.path"
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
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'
import Icon from '@/components/icons/Icon.vue'
import { coreUserNavigation } from './items'

const { t } = useI18n()
const route = useRoute()
const appStore = useAppStore()

const visibleNav = computed(() =>
  coreUserNavigation.filter((item) => {
    if (item.path === '/available-channels') {
      return appStore.cachedPublicSettings?.available_channels_enabled !== false
    }
    return true
  }),
)

function isActive(path: string): boolean {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.g1-bottom-nav {
  display: none;
}

@media (max-width: 1023px) {
  .g1-bottom-nav {
    position: fixed;
    inset: auto 0 0 0;
    z-index: 30;
    display: grid;
    border-top: 1px solid var(--g1-divider);
    background: var(--g1-surface);
  }
}

.g1-bottom-nav__link {
  display: flex;
  min-height: 56px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 4px;
  color: var(--g1-text-tertiary);
  text-decoration: none;
  transition: color 120ms ease;
}

.g1-bottom-nav__link--active {
  color: var(--g1-primary);
}

.g1-bottom-nav__label {
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
}
</style>
