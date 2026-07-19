<template>
  <div data-surface="getoneapi-user" class="g1-user-shell">
    <a class="g1-skip-link" href="#g1-main">{{ t('getoneapi.a11y.skipToContent') }}</a>
    <UserSidebar class="hidden lg:flex" />
    <div class="g1-user-frame">
      <UserHeader />
      <main id="g1-main" tabindex="-1">
        <div class="g1-user-content-inner">
          <slot />
        </div>
      </main>
    </div>
    <UserBottomNav class="lg:hidden" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores'
import { useOnboardingTour } from '@/composables/useOnboardingTour'
import { useOnboardingStore } from '@/stores/onboarding'
import UserSidebar from '@/getoneapi/navigation/UserSidebar.vue'
import UserBottomNav from '@/getoneapi/navigation/UserBottomNav.vue'
import UserHeader from '@/getoneapi/navigation/UserHeader.vue'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()
const onboardingStore = useOnboardingStore()

const isAdmin = computed(() => authStore.user?.role === 'admin')

const { replayTour } = useOnboardingTour({
  storageKey: isAdmin.value ? 'admin_guide' : 'user_guide',
  autoStart: true,
})

onMounted(() => {
  onboardingStore.setReplayCallback(replayTour)
})

onBeforeUnmount(() => {
  onboardingStore.setReplayCallback(null)
})

watch(
  () => route.path,
  () => {
    const main = document.getElementById('g1-main')
    if (main) {
      main.focus({ preventScroll: true })
    }
  },
)

defineExpose({ replayTour })
</script>

<style scoped>
.g1-skip-link {
  position: absolute;
  top: -9999px;
  left: 12px;
  z-index: 100;
  display: flex;
  min-height: 44px;
  align-items: center;
  padding: 0 16px;
  border-radius: var(--g1-radius-md);
  background: var(--g1-primary);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.g1-skip-link:focus {
  top: 8px;
}

.g1-user-shell {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--g1-canvas);
}

.g1-user-frame {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.g1-user-frame main {
  flex: 1;
  padding: 24px clamp(16px, 3vw, 40px);
}

.g1-user-content-inner {
  max-width: 960px;
}

@media (min-width: 1024px) {
  .g1-user-frame {
    margin-left: 260px;
  }

  .g1-user-frame main {
    padding-bottom: 48px;
  }
}

@media (max-width: 1023px) {
  .g1-user-frame main {
    padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
