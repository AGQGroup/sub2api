<template>
  <dl class="g1-definition-list">
    <div v-for="(item, idx) in items" :key="idx" class="g1-definition-list__row">
      <dt class="g1-definition-list__term">{{ item.term }}</dt>
      <dd class="g1-definition-list__def">{{ item.definition }}</dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
defineProps<{
  items: { term: string; definition: string }[]
}>()
</script>

<style scoped>
.g1-definition-list {
  display: grid;
  gap: 0;
  margin: 0;
  border: 1px solid var(--g1-divider);
  border-radius: var(--g1-radius-md);
  overflow: hidden;
}

.g1-definition-list__row {
  display: flex;
  border-bottom: 1px solid var(--g1-divider);
}

.g1-definition-list__row:last-child {
  border-bottom: none;
}

.g1-definition-list__term {
  width: 160px;
  min-width: 120px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--g1-text-secondary);
  background: var(--g1-control);
}

.g1-definition-list__def {
  flex: 1;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--g1-text);
  overflow-wrap: anywhere;
}
</style>
