<template>
  <div class="g1-pricing-table">
    <div class="g1-pricing-table__heading">
      <div>
        <h3>{{ group.name }}</h3>
        <p v-if="group.description">{{ group.description }}</p>
      </div>
      <dl>
        <div>
          <dt>Group multiplier</dt>
          <dd>{{ formatMultiplier(group.rate_multiplier) }}</dd>
        </div>
        <div v-if="group.peak_rate_enabled">
          <dt>Peak multiplier</dt>
          <dd>{{ formatMultiplier(group.peak_rate_multiplier) }} ({{ group.peak_start }}-{{ group.peak_end }})</dd>
        </div>
      </dl>
    </div>

    <p class="g1-pricing-table__protocol">
      {{ protocolLabel(group.platform) }} · {{ group.platform }}
    </p>
    <p v-if="group.supported_clients.length" class="g1-pricing-table__clients">
      Reviewed clients: {{ group.supported_clients.join(', ') }}
    </p>

    <table>
      <caption class="sr-only">Representative public model prices for {{ group.name }}</caption>
      <thead>
        <tr>
          <th scope="col">Model</th>
          <th scope="col">Billing</th>
          <th scope="col">Effective public price</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="model in representativeModels" :key="`${model.platform}:${model.name}`">
          <th scope="row">
            <span>{{ model.name }}</span>
            <small>{{ model.platform }}</small>
          </th>
          <td>{{ billingLabel(model.pricing.billing_mode) }}</td>
          <td>
            <span
              v-for="price in publishedPrices(model.pricing)"
              :key="price.label"
              class="g1-pricing-table__price"
              data-ui="catalog-price"
            >
              <small>{{ price.label }}</small>
              {{ formatPrice(price.value) }} {{ price.unit }}
            </span>
            <div
              v-for="(interval, index) in model.pricing.intervals"
              :key="`${interval.min_tokens}:${interval.max_tokens}:${interval.tier_label || index}`"
              class="g1-pricing-table__tier"
              data-ui="catalog-tier"
            >
              <strong>{{ intervalLabel(interval) }}</strong>
              <span
                v-for="price in intervalPrices(interval, model.pricing.billing_mode)"
                :key="price.label"
                class="g1-pricing-table__price"
                data-ui="catalog-price"
              >
                <small>{{ price.label }}</small>
                {{ formatPrice(price.value) }} {{ price.unit }}
              </span>
            </div>
            <span
              v-if="!publishedPrices(model.pricing).length && !model.pricing.intervals.length"
            >
              Not published
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  PublicCatalogGroup,
  PublicCatalogPricing,
  PublicCatalogPricingInterval,
} from '@/getoneapi/catalog/types'

const props = defineProps<{
  group: PublicCatalogGroup
  currency: 'USD'
}>()

interface EffectivePrice {
  label: string
  value: number
  unit: '/ 1M' | '/ request'
}

const representativeModels = computed(() => props.group.models.slice(0, 3))

function priceEntries(
  pricing: Pick<
    PublicCatalogPricing,
    | 'billing_mode'
    | 'input_per_million'
    | 'output_per_million'
    | 'cache_write_per_million'
    | 'cache_read_per_million'
    | 'image_output_per_million'
    | 'per_request'
  >
): EffectivePrice[] {
  const values: Array<[string, number | null, EffectivePrice['unit']]> = pricing.billing_mode === 'per_request' || pricing.billing_mode === 'image'
    ? [['Request', pricing.per_request, '/ request']]
    : [
        ['Input', pricing.input_per_million, '/ 1M'],
        ['Output', pricing.output_per_million, '/ 1M'],
        ['Cache write', pricing.cache_write_per_million, '/ 1M'],
        ['Cache read', pricing.cache_read_per_million, '/ 1M'],
        ['Image output', pricing.image_output_per_million, '/ 1M'],
      ]

  return values.flatMap(([label, value, unit]) =>
    value === null ? [] : [{ label, value, unit }]
  )
}

function publishedPrices(pricing: PublicCatalogPricing): EffectivePrice[] {
  const prices = priceEntries(pricing)
  if (pricing.intervals.length && pricing.per_request === 0) {
    return prices.filter((price) => price.label !== 'Request')
  }
  return prices
}

function intervalPrices(
  interval: PublicCatalogPricingInterval,
  billingMode: PublicCatalogPricing['billing_mode']
): EffectivePrice[] {
  return priceEntries({
    billing_mode: billingMode,
    input_per_million: interval.input_per_million,
    output_per_million: interval.output_per_million,
    cache_write_per_million: interval.cache_write_per_million,
    cache_read_per_million: interval.cache_read_per_million,
    image_output_per_million: null,
    per_request: interval.per_request,
  })
}

function intervalLabel(interval: PublicCatalogPricingInterval): string {
  if (interval.tier_label) return interval.tier_label
  const min = interval.min_tokens.toLocaleString('en-US')
  if (interval.max_tokens === null) return `${min}+ tokens`
  return `${min}-${interval.max_tokens.toLocaleString('en-US')} tokens`
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: props.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value)
}

function formatMultiplier(value: number): string {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(value)}x`
}

function billingLabel(mode: PublicCatalogPricing['billing_mode']): string {
  if (mode === 'per_request') return 'Per request'
  if (mode === 'image') return 'Image tokens'
  return 'Token'
}

function protocolLabel(platform: string): string {
  const normalized = platform.toLowerCase()
  if (normalized.includes('anthropic')) return 'Anthropic Messages protocol'
  if (normalized.includes('gemini') || normalized.includes('google')) return 'Gemini protocol'
  if (normalized.includes('openai') || normalized.includes('codex')) return 'OpenAI-compatible protocol'
  return 'Platform-native protocol'
}
</script>

<style scoped>
.g1-pricing-table__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding-block: 20px 12px;
}

.g1-pricing-table h3,
.g1-pricing-table p,
.g1-pricing-table dl {
  margin: 0;
}

.g1-pricing-table__heading p,
.g1-pricing-table__protocol,
.g1-pricing-table__clients {
  margin-top: 6px;
  color: var(--g1-text-secondary);
  line-height: 1.5;
}

.g1-pricing-table__heading dl {
  flex: 0 1 300px;
  color: var(--g1-text-secondary);
  font-size: 13px;
  text-align: right;
}

.g1-pricing-table__heading dl div + div {
  margin-top: 4px;
}

.g1-pricing-table__heading dt,
.g1-pricing-table__heading dd {
  display: inline;
  margin: 0;
}

.g1-pricing-table__heading dt::after {
  content: ': ';
}

.g1-pricing-table__protocol,
.g1-pricing-table__clients {
  font-size: 13px;
}

.g1-pricing-table table {
  table-layout: fixed;
  margin-top: 16px;
}

.g1-pricing-table th:first-child {
  width: 30%;
}

.g1-pricing-table th:nth-child(2) {
  width: 18%;
}

.g1-pricing-table th,
.g1-pricing-table td {
  overflow-wrap: anywhere;
  vertical-align: top;
}

.g1-pricing-table tbody th span,
.g1-pricing-table tbody th small,
.g1-pricing-table__price,
.g1-pricing-table__price small {
  display: block;
}

.g1-pricing-table tbody th small,
.g1-pricing-table__price small {
  color: var(--g1-text-tertiary);
  font-size: 11px;
  font-weight: 400;
}

.g1-pricing-table__price {
  margin-bottom: 7px;
  font-variant-numeric: tabular-nums;
}

.g1-pricing-table__tier {
  padding-top: 6px;
  border-top: 1px solid var(--g1-divider);
}

.g1-pricing-table__tier strong {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
}

@media (max-width: 1023px) {
  .g1-pricing-table__heading {
    display: block;
  }

  .g1-pricing-table__heading dl {
    margin-top: 12px;
    text-align: left;
  }

  .g1-pricing-table th,
  .g1-pricing-table td {
    padding: 10px 6px;
    font-size: 12px;
  }

  .g1-pricing-table th:first-child {
    width: 34%;
  }

  .g1-pricing-table th:nth-child(2) {
    width: 20%;
  }
}
</style>
