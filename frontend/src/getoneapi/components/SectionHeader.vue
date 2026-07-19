<template>
  <div class="g1-section-header">
    <h2 v-if="title" class="g1-section-header__title">{{ title }}</h2>
    <p v-if="description" class="g1-section-header__desc">{{ description }}</p>
    <div v-if="$slots.actions" class="g1-section-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<style scoped>
.g1-section-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 16px;
  margin-bottom: 16px;
}

.g1-section-header__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--g1-text);
}

.g1-section-header__desc {
  margin: 0;
  width: 100%;
  color: var(--g1-text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.g1-section-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
