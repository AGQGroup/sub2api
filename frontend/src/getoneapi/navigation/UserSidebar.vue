<template>
  <aside
    class="g1-sidebar hidden lg:flex"
    aria-label="Main navigation"
  >
    <div class="g1-sidebar__brand">
      <router-link to="/dashboard" class="g1-sidebar__logo" :aria-label="appStore.siteName">
        <Icon name="home" size="lg" aria-hidden="true" />
      </router-link>
      <div class="g1-sidebar__brand-text">
        <router-link to="/dashboard" class="g1-sidebar__title">
          {{ appStore.siteName }}
        </router-link>
        <span v-if="authStore.user" class="g1-sidebar__user-mail">{{ authStore.user.email }}</span>
      </div>
    </div>

    <nav class="g1-sidebar__nav">
      <div v-if="visibleCoreNav.length" class="g1-sidebar__group">
        <ul class="g1-sidebar__list">
          <li v-for="item in visibleCoreNav" :key="item.path">
            <router-link
              :to="item.path"
              class="g1-sidebar__link"
              :class="{ 'g1-sidebar__link--active': isActive(item.path) }"
              :data-ui="'nav-item'"
            >
              <span class="g1-sidebar__link-icon"><Icon :name="(item.icon as any)" size="md" aria-hidden="true" /></span>
              <span class="g1-sidebar__label">{{ t(item.labelKey) }}</span>
            </router-link>
          </li>
        </ul>
      </div>

      <div v-if="visibleSecondaryNav.length" class="g1-sidebar__group">
        <p class="g1-sidebar__section-label">{{ t('getoneapi.nav.finance') }}</p>
        <ul class="g1-sidebar__list">
          <li v-for="item in visibleSecondaryNav" :key="item.path">
            <router-link
              :to="item.path"
              class="g1-sidebar__link"
              :class="{ 'g1-sidebar__link--active': isActive(item.path) }"
              :data-ui="'nav-item'"
            >
              <span class="g1-sidebar__link-icon"><Icon :name="(item.icon as any)" size="md" aria-hidden="true" /></span>
              <span class="g1-sidebar__label">{{ t(item.labelKey) }}</span>
            </router-link>
          </li>
        </ul>
      </div>

      <div v-if="visibleUtilityNav.length" class="g1-sidebar__group">
        <p class="g1-sidebar__section-label">{{ t('getoneapi.nav.tools') }}</p>
        <ul class="g1-sidebar__list">
          <li v-for="item in visibleUtilityNav" :key="item.path">
            <router-link
              :to="item.path"
              class="g1-sidebar__link"
              :class="{ 'g1-sidebar__link--active': isActive(item.path) }"
              :data-ui="'nav-item'"
            >
              <span class="g1-sidebar__link-icon"><Icon :name="(item.icon as any)" size="md" aria-hidden="true" /></span>
              <span class="g1-sidebar__label">{{ t(item.labelKey) }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <div class="g1-sidebar__footer">
      <a
        v-if="appStore.docUrl"
        :href="appStore.docUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="g1-sidebar__footer-link"
      >
        <Icon name="book" size="md" aria-hidden="true" />
        <span>{{ t('getoneapi.nav.docs') }}</span>
      </a>
      <button
        type="button"
        class="g1-sidebar__footer-link g1-sidebar__logout"
        @click="handleLogout"
      >
        <Icon name="login" size="md" aria-hidden="true" />
        <span>{{ t('getoneapi.nav.logout') }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore, useAuthStore } from '@/stores'
import Icon from '@/components/icons/Icon.vue'
import { coreUserNavigation, secondaryNavigation, utilityNavigation } from './items'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const visibleCoreNav = computed(() =>
  coreUserNavigation.filter((item) => {
    if (item.path === '/available-channels') {
      return appStore.cachedPublicSettings?.available_channels_enabled !== false
    }
    return true
  }),
)

const visibleSecondaryNav = computed(() =>
  secondaryNavigation.filter((item) => {
    if (item.path === '/purchase' || item.path === '/subscriptions' || item.path === '/orders') {
      return appStore.cachedPublicSettings?.payment_enabled !== false
    }
    if (item.path === '/redeem') return !authStore.isSimpleMode
    if (item.path === '/affiliate') return (
      appStore.cachedPublicSettings?.affiliate_enabled !== false && !authStore.isSimpleMode
    )
    return true
  }),
)

const visibleUtilityNav = computed(() =>
  utilityNavigation.filter((item) => {
    if (item.path === '/monitor') {
      return appStore.cachedPublicSettings?.channel_monitor_enabled !== false
    }
    if (item.path === '/batch-image') return true
    if (item.path === '/orders') {
      return appStore.cachedPublicSettings?.payment_enabled !== false
    }
    return true
  }),
)

function isActive(path: string): boolean {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
}

async function handleLogout(): Promise<void> {
  await authStore.logout()
  await router.push('/login')
}
</script>

<style scoped>
.g1-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 30;
  width: 260px;
  flex-direction: column;
  border-right: 1px solid var(--g1-divider);
  background: var(--g1-surface);
  user-select: none;
}

.g1-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 64px;
  padding: 0 20px;
}

.g1-sidebar__logo {
  display: flex;
  width: 44px;
  height: 44px;
  min-width: 44px;
  align-items: center;
  justify-content: center;
  border-radius: var(--g1-radius-md);
  background: var(--g1-primary);
  color: #ffffff;
  text-decoration: none;
}

.g1-sidebar__brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
}

.g1-sidebar__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 700;
  color: var(--g1-text);
  text-decoration: none;
  line-height: 1.2;
}

.g1-sidebar__user-mail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--g1-text-tertiary);
}

.g1-sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}

.g1-sidebar__group + .g1-sidebar__group {
  margin-top: 8px;
}

.g1-sidebar__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.g1-sidebar__section-label {
  margin: 4px 8px 2px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--g1-text-tertiary);
  line-height: 2;
}

.g1-sidebar__link {
  display: flex;
  width: 100%;
  min-height: 40px;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  margin-bottom: 1px;
  border-radius: var(--g1-radius-md);
  color: var(--g1-text);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 100ms ease;
  position: relative;
}

.g1-sidebar__link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  translate: 0 -50%;
  width: 3px;
  height: 0;
  border-radius: 0 2px 2px 0;
  background: var(--g1-primary);
  transition: height 150ms ease;
}

.g1-sidebar__link:hover {
  background: var(--g1-control);
}

.g1-sidebar__link--active {
  background: var(--g1-control);
  font-weight: 600;
  color: var(--g1-primary);
}

.g1-sidebar__link--active::before {
  height: 18px;
}

.g1-sidebar__link-icon {
  display: flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: inherit;
}

.g1-sidebar__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.g1-sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-top: 1px solid var(--g1-divider);
}

.g1-sidebar__footer-link {
  display: flex;
  min-height: 40px;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  border-radius: var(--g1-radius-md);
  color: var(--g1-text-secondary);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 100ms ease;
}

.g1-sidebar__footer-link:hover {
  background: var(--g1-control);
  color: var(--g1-text);
}

.g1-sidebar__logout {
  color: var(--g1-text-tertiary);
}

.g1-sidebar__logout:hover {
  color: var(--g1-danger);
}
</style>
