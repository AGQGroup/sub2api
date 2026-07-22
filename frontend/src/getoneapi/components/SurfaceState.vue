<template>
  <section :data-catalog-state="state" class="g1-surface-state" :aria-busy="state === 'loading'">
    <template v-if="state === 'loading'">
      <span class="sr-only">Loading public pricing</span>
      <div v-for="row in 3" :key="row" class="g1-surface-state__skeleton" aria-hidden="true"></div>
    </template>
    <template v-else>
      <h3>{{ title }}</h3>
      <p v-if="message">{{ message }}</p>
      <div class="g1-surface-state__actions">
        <button
          v-if="retryable"
          type="button"
          data-ui="catalog-retry"
          @click="$emit('retry')"
        >
          <Icon name="refresh" size="sm" aria-hidden="true" />
          Retry
        </button>
        <slot />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import Icon from '@/components/icons/Icon.vue'

withDefaults(defineProps<{
  state: 'disabled' | 'loading' | 'empty' | 'error'
  title?: string
  message?: string
  retryable?: boolean
}>(), {
  title: '',
  message: '',
  retryable: false,
})

defineEmits<{ retry: [] }>()
</script>

<style scoped>
.g1-surface-state {
  min-height: 180px;
  padding: 24px 0;
  border-block: 1px solid var(--g1-divider);
}

.g1-surface-state h3,
.g1-surface-state p {
  margin: 0;
}

.g1-surface-state p {
  max-width: 64ch;
  margin-top: 8px;
  color: var(--g1-text-secondary);
  line-height: 1.6;
}

.g1-surface-state__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--g1-space-3);
  margin-top: 16px;
}

.g1-surface-state__actions button {
  display: inline-flex;
  align-items: center;
  gap: var(--g1-space-2);
}

.g1-surface-state__skeleton {
  height: 38px;
  margin-bottom: 12px;
  border-radius: var(--g1-radius-sm);
  background: var(--g1-control);
  animation: g1-state-pulse 1.2s ease-in-out infinite alternate;
}

@keyframes g1-state-pulse {
  from { opacity: 0.55; }
  to { opacity: 1; }
}
</style>
