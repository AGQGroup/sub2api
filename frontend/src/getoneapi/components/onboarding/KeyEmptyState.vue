<template>
  <section data-ui="key-empty-state" class="g1-key-empty">
    <div class="g1-key-empty__icon" aria-hidden="true">
      <Icon name="key" size="xl" />
    </div>
    <h3>{{ t('getoneapi.keys.emptyTitle') }}</h3>
    <p class="g1-key-empty__desc">{{ t('getoneapi.keys.emptyDesc') }}</p>
    <button
      type="button"
      data-variant="primary"
      data-ui="create-key"
      class="g1-key-empty__action"
      @click="$emit('createKey')"
    >
      <Icon name="plus" size="sm" aria-hidden="true" />
      {{ t('getoneapi.keys.createFirst') }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()

defineEmits<{ createKey: [] }>()
</script>

<style scoped>
.g1-key-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 24px;
  text-align: center;
}

.g1-key-empty__icon {
  display: flex;
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  border-radius: 50%;
  background: var(--g1-control);
  color: var(--g1-text-secondary);
}

.g1-key-empty h3 {
  margin: 0 0 8px;
  font-size: var(--g1-text-lg);
  font-weight: 700;
  color: var(--g1-text);
}

.g1-key-empty__desc {
  max-width: 400px;
  margin: 0 0 24px;
  color: var(--g1-text-secondary);
  font-size: var(--g1-text-base);
  line-height: 1.5;
}

.g1-key-empty__action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: var(--g1-space-2);
  padding: 0 20px;
  border: none;
  border-radius: var(--g1-radius-md);
  background: var(--g1-primary);
  color: #ffffff;
  font-size: var(--g1-text-base);
  font-weight: 600;
  cursor: pointer;
}
</style>
