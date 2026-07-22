<template>
  <div data-ui="dashboard-experience" class="g1-dashboard">
    <section data-ui="metrics" class="g1-dashboard__metrics-row">
      <div class="g1-metric-card" data-ui="metric-balance">
        <div class="g1-metric-card__top">
          <span class="g1-metric-card__label">{{ t('getoneapi.dashboard.balance') }}</span>
          <span class="g1-metric-card__icon g1-metric-card__icon--blue"><Icon name="creditCard" size="md" aria-hidden="true" /></span>
        </div>
        <span class="g1-metric-card__value">{{ balanceText }}</span>
      </div>
      <div class="g1-metric-card" data-ui="metric-requests">
        <div class="g1-metric-card__top">
          <span class="g1-metric-card__label">{{ t('getoneapi.dashboard.requestsToday') }}</span>
          <span class="g1-metric-card__icon g1-metric-card__icon--green"><Icon name="bolt" size="md" aria-hidden="true" /></span>
        </div>
        <span class="g1-metric-card__value">{{ formatNumber(stats?.today_requests) }}</span>
      </div>
      <div class="g1-metric-card" data-ui="metric-keys">
        <div class="g1-metric-card__top">
          <span class="g1-metric-card__label">{{ t('getoneapi.dashboard.activeKeys') }}</span>
          <span class="g1-metric-card__icon g1-metric-card__icon--purple"><Icon name="key" size="md" aria-hidden="true" /></span>
        </div>
        <span class="g1-metric-card__value">{{ formatNumber(stats?.active_api_keys) }}</span>
      </div>
      <div class="g1-metric-card" data-ui="metric-health">
        <div class="g1-metric-card__top">
          <span class="g1-metric-card__label">{{ t('getoneapi.dashboard.status') }}</span>
          <span class="g1-health-dot" :class="healthClass" aria-hidden="true" />
        </div>
        <span class="g1-metric-card__value g1-metric-card__value--small">{{ healthLabel }}</span>
      </div>
    </section>

    <div class="g1-dashboard__grid">
      <section data-ui="first-request-checklist" class="g1-dashboard__main">
        <FirstRequestChecklist
          :facts="firstRequestFacts"
          @create-key="$emit('createKey')"
        />
      </section>

      <section data-ui="quick-actions" class="g1-dashboard__side">
        <h3 class="g1-section-title">{{ t('getoneapi.dashboard.quickActions') }}</h3>
        <div class="g1-quick-actions">
          <button type="button" data-ui="action-create-key" class="g1-quick-action" @click="$emit('createKey')">
            <span class="g1-quick-action__icon"><Icon name="key" size="md" aria-hidden="true" /></span>
            <span class="g1-quick-action__label">{{ t('getoneapi.dashboard.createKey') }}</span>
          </button>
          <router-link v-if="appStore.cachedPublicSettings?.payment_enabled !== false" to="/purchase" class="g1-quick-action">
            <span class="g1-quick-action__icon"><Icon name="creditCard" size="md" aria-hidden="true" /></span>
            <span class="g1-quick-action__label">{{ t('getoneapi.dashboard.topUp') }}</span>
          </router-link>
          <router-link v-if="appStore.cachedPublicSettings?.available_channels_enabled !== false" to="/available-channels" class="g1-quick-action">
            <span class="g1-quick-action__icon"><Icon name="server" size="md" aria-hidden="true" /></span>
            <span class="g1-quick-action__label">{{ t('getoneapi.dashboard.services') }}</span>
          </router-link>
        </div>
      </section>
    </div>

    <section data-ui="recent-requests" class="g1-dashboard__card">
      <div class="g1-dashboard__card-hd">
        <h3 class="g1-section-title">{{ t('getoneapi.dashboard.recentRequests') }}</h3>
        <button type="button" class="g1-text-btn" @click="$emit('refresh')">
          <Icon name="refresh" size="sm" aria-hidden="true" />
          {{ t('common.refresh') }}
        </button>
      </div>
      <div v-if="loadingUsage" class="g1-table-skeleton">
        <div v-for="r in 3" :key="r" class="g1-table-row-skel" />
      </div>
      <div v-else-if="!recentUsage?.length" class="g1-card-empty">
        <Icon name="inbox" size="lg" aria-hidden="true" class="g1-card-empty__icon" />
        <p>{{ t('getoneapi.dashboard.noRequests') }}</p>
      </div>
      <table v-else class="g1-table">
        <thead>
          <tr>
            <th>{{ t('getoneapi.dashboard.model') }}</th>
            <th class="g1-table__num">{{ t('getoneapi.dashboard.tokens') }}</th>
            <th class="g1-table__num">{{ t('getoneapi.dashboard.cost') }}</th>
            <th class="g1-table__num">{{ t('getoneapi.dashboard.time') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in recentUsage" :key="item.id">
            <td class="g1-table__model">{{ item.model || '—' }}</td>
            <td class="g1-table__num tabular-nums">{{ formatTokens(item.input_tokens + item.output_tokens) }}</td>
            <td class="g1-table__num tabular-nums">{{ formatCost(item.actual_cost) }}</td>
            <td class="g1-table__num g1-table__time tabular-nums">{{ formatTime(item.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'
import Icon from '@/components/icons/Icon.vue'
import FirstRequestChecklist from '@/getoneapi/components/onboarding/FirstRequestChecklist.vue'
import type { FirstRequestFacts } from '@/getoneapi/adapters/firstRequestProgress'
import type { UserDashboardStats } from '@/api/usage'
import type { User, TrendDataPoint, ModelStat, UsageLog, PlatformQuotaItem } from '@/types'

const { t } = useI18n()
const appStore = useAppStore()

const props = withDefaults(
  defineProps<{
    stats: UserDashboardStats | null
    user: User | null
    platformQuotas?: PlatformQuotaItem[] | null
    trend?: TrendDataPoint[] | null
    models?: ModelStat[] | null
    recentUsage?: UsageLog[] | null
    loading: boolean
    loadingCharts: boolean
    loadingUsage: boolean
    firstRequestFacts: FirstRequestFacts
    healthStatus?: 'operational' | 'unknown'
  }>(),
  { platformQuotas: null, trend: null, models: null, recentUsage: null, healthStatus: 'unknown' },
)

defineEmits<{ createKey: []; refresh: []; rangeChange: [] }>()

const balanceText = computed(() => {
  if (props.user?.balance == null) return '—'
  return `$${props.user.balance.toFixed(2)}`
})

const healthClass = computed(() =>
  props.healthStatus === 'operational' ? 'g1-health-dot--ok' : 'g1-health-dot--unknown',
)

const healthLabel = computed(() =>
  props.healthStatus === 'operational'
    ? t('getoneapi.dashboard.statusOperational')
    : t('getoneapi.dashboard.statusUnknown'),
)

function formatNumber(value?: number): string {
  if (value == null) return '—'
  return value.toLocaleString()
}

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function formatCost(value?: number): string {
  if (value == null) return '—'
  return `$${value.toFixed(4)}`
}

function formatTime(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.g1-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.g1-dashboard__metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.g1-metric-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 24px;
  border: 1px solid var(--g1-divider);
  border-radius: var(--g1-radius-md);
  background: var(--g1-surface);
  box-shadow: var(--g1-shadow-raised);
  transition: box-shadow 150ms ease;
}

.g1-metric-card:hover {
  box-shadow: 0 4px 16px rgb(0 0 0 / 10%);
}

.g1-metric-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.g1-metric-card__icon {
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: var(--g1-radius-sm);
}

.g1-metric-card__icon--blue {
  background: rgb(0 113 227 / 10%);
  color: var(--g1-primary);
}

.g1-metric-card__icon--green {
  background: rgb(36 138 61 / 10%);
  color: var(--g1-success);
}

.g1-metric-card__icon--purple {
  background: rgb(128 88 199 / 12%);
  color: #8058c7;
}

.dark .g1-metric-card__icon--blue {
  background: rgb(10 132 255 / 15%);
}

.dark .g1-metric-card__icon--green {
  background: rgb(48 209 88 / 15%);
}

.dark .g1-metric-card__icon--purple {
  background: rgb(150 110 215 / 18%);
  color: #a88ade;
}

.g1-metric-card__label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--g1-text-tertiary);
}

.g1-metric-card__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--g1-text);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.g1-metric-card__value--small {
  font-size: 18px;
  font-weight: 600;
}

.g1-metric-card__health-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.g1-health-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--g1-text-tertiary);
  flex-shrink: 0;
}

.g1-health-dot--ok {
  background: var(--g1-success);
}

.g1-dashboard__grid {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 24px;
  align-items: start;
}

.g1-dashboard__main {
  min-width: 0;
}

.g1-dashboard__side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.g1-section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--g1-text);
}

.g1-quick-actions {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.g1-quick-action {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  border-radius: var(--g1-radius-md);
  color: var(--g1-text);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 120ms ease;
}

.g1-quick-action:hover {
  background: var(--g1-control);
}

.g1-quick-action__icon {
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: var(--g1-radius-sm);
  background: var(--g1-control);
  color: var(--g1-primary);
  flex-shrink: 0;
}

.g1-quick-action__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.g1-dashboard__card {
  border: 1px solid var(--g1-divider);
  border-radius: var(--g1-radius-md);
  background: var(--g1-surface);
  box-shadow: var(--g1-shadow-raised);
  overflow: hidden;
}

.g1-dashboard__card-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--g1-divider);
}

.g1-text-btn {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border-radius: var(--g1-radius-sm);
  border: none;
  background: transparent;
  color: var(--g1-link);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.g1-text-btn:hover {
  background: var(--g1-control);
}

.g1-table-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.g1-table-row-skel {
  height: 45px;
  width: 100%;
  background: var(--g1-control);
}

.g1-table-row-skel + .g1-table-row-skel {
  border-top: 1px solid var(--g1-surface);
}

.g1-card-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  color: var(--g1-text-tertiary);
}

.g1-card-empty p {
  margin: 0;
  font-size: 14px;
  color: var(--g1-text-secondary);
}

.g1-table {
  width: 100%;
  border-collapse: collapse;
}

.g1-table th,
.g1-table td {
  padding: 10px 20px;
  font-size: 13px;
  text-align: left;
  border-bottom: 1px solid var(--g1-divider);
}

.g1-table th {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--g1-text-tertiary);
  background: var(--g1-control);
}

.g1-table__num {
  text-align: right;
}

.g1-table__time {
  color: var(--g1-text-secondary);
}

.g1-table__model {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

.g1-table tbody tr {
  transition: background-color 100ms ease;
}

.g1-table tbody tr:hover {
  background: var(--g1-control);
}

.g1-table tr:last-child td {
  border-bottom: none;
}

@media (max-width: 767px) {
  .g1-dashboard__grid {
    grid-template-columns: 1fr;
  }

  .g1-dashboard__metrics-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .g1-metric-card__value {
    font-size: 22px;
  }
}
</style>
