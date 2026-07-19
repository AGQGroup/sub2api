<template>
  <section
    class="g1-auth-state"
    :role="state === 'error' ? 'alert' : 'status'"
    :aria-live="state === 'error' ? 'assertive' : 'polite'"
    :aria-busy="state === 'loading' ? 'true' : 'false'"
    :data-auth-state="state"
  >
    <div class="g1-auth-state__icon" aria-hidden="true">
      <svg v-if="state === 'loading'" class="g1-auth-state__spinner" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25" />
        <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      </svg>
      <Icon v-else-if="state === 'success'" name="checkCircle" size="xl" />
      <Icon v-else-if="state === 'warning'" name="exclamationTriangle" size="xl" />
      <Icon v-else-if="state === 'error'" name="xCircle" size="xl" />
    </div>

    <h2 class="g1-auth-state__title">{{ title }}</h2>

    <p v-if="description" class="g1-auth-state__desc">{{ description }}</p>

    <div v-if="retryLabel || backHref" class="g1-auth-state__actions">
      <button
        v-if="retryLabel"
        type="button"
        data-variant="primary"
        :disabled="busy"
        data-ui="auth-retry"
        @click="$emit('retry')"
      >
        <Icon v-if="!busy" name="refresh" size="sm" aria-hidden="true" />
        {{ retryLabel }}
      </button>
      <router-link
        v-if="backHref"
        :to="backHref"
        data-ui="auth-back"
        class="g1-auth-state__back"
      >
        Back
      </router-link>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
import Icon from '@/components/icons/Icon.vue'

withDefaults(
  defineProps<{
    state: 'loading' | 'success' | 'warning' | 'error'
    title: string
    description?: string
    retryLabel?: string
    backHref?: string
    busy?: boolean
  }>(),
  { description: '', retryLabel: '', backHref: '/login', busy: false },
)

defineEmits<{ retry: [] }>()
</script>

<style scoped>
.g1-auth-state {
  padding: 40px 24px;
  text-align: center;
}

.g1-auth-state__icon {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

[data-auth-state='loading'] .g1-auth-state__icon {
  color: var(--g1-primary);
}

[data-auth-state='success'] .g1-auth-state__icon {
  color: var(--g1-success);
}

[data-auth-state='warning'] .g1-auth-state__icon {
  color: var(--g1-warning);
}

[data-auth-state='error'] .g1-auth-state__icon {
  color: var(--g1-danger);
}

.g1-auth-state__spinner {
  width: 40px;
  height: 40px;
  animation: g1-spin 1s linear infinite;
}

@keyframes g1-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.g1-auth-state__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--g1-text);
}

.g1-auth-state__desc {
  max-width: 48ch;
  margin: 12px auto 0;
  color: var(--g1-text-secondary);
  font-size: 15px;
  line-height: 1.6;
}

.g1-auth-state__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

.g1-auth-state__back {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding: 0 16px;
  border-radius: var(--g1-radius-md);
  background: var(--g1-control);
  color: var(--g1-text);
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}
</style>
