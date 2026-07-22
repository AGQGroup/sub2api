<template>
  <header class="g1-page-header">
    <div class="content g1-page-header__inner">
      <BrandLockup :site-name="appStore.siteName" :logo-url="appStore.siteLogo" />

      <div class="g1-page-header__actions">
        <p v-if="showHealth" class="g1-health" aria-live="polite">
          <span class="g1-health__indicator" :data-status="health" aria-hidden="true"></span>
          {{ health === 'operational' ? 'Operational' : 'Status unavailable' }}
        </p>
        <ThemeModeControl />
        <LanguageMenu />
        <a v-if="showLogin" href="/login" class="g1-login-link">Sign in</a>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { getPublicHealth } from '@/getoneapi/public/health'
import BrandLockup from './BrandLockup.vue'
import LanguageMenu from './LanguageMenu.vue'
import ThemeModeControl from './ThemeModeControl.vue'

const props = withDefaults(defineProps<{
  showHealth?: boolean
  showLogin?: boolean
}>(), {
  showHealth: true,
  showLogin: true,
})

const appStore = useAppStore()
const health = ref<'operational' | 'unknown'>('unknown')
const controller = new AbortController()

onMounted(async () => {
  if (!props.showHealth) return
  health.value = await getPublicHealth(controller.signal)
})
onBeforeUnmount(() => controller.abort())
</script>

<style scoped>
.g1-page-header {
  border-bottom: 1px solid var(--g1-divider);
  background: var(--g1-surface);
}

.g1-page-header__inner {
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: var(--g1-space-4);
  padding: 8px clamp(16px, 3vw, 40px);
}

.g1-page-header__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--g1-space-2);
}

.g1-health {
  display: flex;
  align-items: center;
  gap: var(--g1-space-2);
  margin: 0 8px 0 0;
  color: var(--g1-text-secondary);
  font-size: 14px;
}

.g1-health__indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--g1-text-tertiary);
}

.g1-health__indicator[data-status='operational'] {
  background: var(--g1-success);
}

.g1-login-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding-inline: 12px;
  color: var(--g1-link);
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 767px) {
  .g1-page-header__inner {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .g1-page-header__actions {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .g1-health {
    order: 4;
    width: 100%;
    justify-content: flex-start;
    margin: 0;
  }
}
</style>
