<template>
  <dl class="g1-catalog-meta">
    <div>
      <dt>Currency</dt>
      <dd data-ui="catalog-currency">{{ catalog.currency }}</dd>
    </div>
    <div>
      <dt>Price unit</dt>
      <dd>{{ catalog.token_price_unit === 'per_1m_tokens' ? 'Per 1M tokens' : catalog.token_price_unit }}</dd>
    </div>
    <div>
      <dt>Version</dt>
      <dd>{{ catalog.version }}</dd>
    </div>
    <div>
      <dt>Updated</dt>
      <dd data-ui="catalog-updated-at">{{ catalog.updated_at }}</dd>
    </div>
    <div>
      <dt>Timezone</dt>
      <dd>{{ catalog.timezone }}</dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import type { PublicCatalog } from '@/getoneapi/catalog/types'

defineProps<{ catalog: PublicCatalog }>()
</script>

<style scoped>
.g1-catalog-meta {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  border-block: 1px solid var(--g1-divider);
  background: var(--g1-divider);
}

.g1-catalog-meta > div {
  min-width: 0;
  padding: 12px;
  background: var(--g1-surface);
}

.g1-catalog-meta dt {
  color: var(--g1-text-tertiary);
  font-size: 12px;
}

.g1-catalog-meta dd {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
  color: var(--g1-text);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1023px) {
  .g1-catalog-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .g1-catalog-meta > div:last-child {
    grid-column: 1 / -1;
  }
}
</style>
