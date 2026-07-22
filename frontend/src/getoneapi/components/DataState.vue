<template>
  <section
    class="g1-data-state"
    :data-error-state="state"
    :role="state === 'error' || state === 'forbidden' || state === 'rate-limited' || state === 'maintenance' ? 'alert' : undefined"
  >
    <div class="g1-data-state__icon" aria-hidden="true">
      <Icon v-if="state === 'loading'" name="refresh" size="lg" class="animate-spin" />
      <Icon v-else-if="state === 'empty'" name="inbox" size="lg" />
      <Icon v-else-if="state === 'forbidden'" name="ban" size="lg" />
      <Icon v-else name="exclamationCircle" size="lg" />
    </div>

    <h3 class="g1-data-state__title">{{ title }}</h3>
    <p v-if="message" class="g1-data-state__message">{{ message }}</p>

    <div class="g1-data-state__actions">
      <slot name="actions" />
      <button
        v-if="retryable"
        type="button"
        data-variant="primary"
        data-ui="data-state-retry"
        @click="$emit('retry')"
      >
        <Icon name="refresh" size="sm" aria-hidden="true" />
        {{ retryLabel || t('common.retry') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()

withDefaults(
  defineProps<{
    state: 'loading' | 'empty' | 'forbidden' | 'rate-limited' | 'maintenance' | 'error'
    title?: string
    message?: string
    retryable?: boolean
    retryLabel?: string
  }>(),
  { title: '', message: '', retryable: false, retryLabel: '' },
)

defineEmits<{ retry: [] }>()
</script>

<style scoped>
.g1-data-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px;
  text-align: center;
}

.g1-data-state__icon {
  display: flex;
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  border-radius: 50%;
  background: var(--g1-control);
  color: var(--g1-text-tertiary);
}

[data-error-state='empty'] .g1-data-state__icon {
  background: var(--g1-control);
}

[data-error-state='forbidden'] .g1-data-state__icon,
[data-error-state='error'] .g1-data-state__icon {
  background: rgb(215 0 21 / 8%);
  color: var(--g1-danger);
}

[data-error-state='rate-limited'] .g1-data-state__icon,
[data-error-state='maintenance'] .g1-data-state__icon {
  background: rgb(178 80 0 / 10%);
  color: var(--g1-warning);
}

.dark [data-error-state='forbidden'] .g1-data-state__icon,
.dark [data-error-state='error'] .g1-data-state__icon {
  background: rgb(255 69 58 / 12%);
}

.dark [data-error-state='rate-limited'] .g1-data-state__icon,
.dark [data-error-state='maintenance'] .g1-data-state__icon {
  background: rgb(255 159 10 / 12%);
}

.g1-data-state__title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  color: var(--g1-text);
}

.g1-data-state__message {
  max-width: 48ch;
  margin: 10px 0 0;
  color: var(--g1-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.g1-data-state__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 22px;
}
</style>
