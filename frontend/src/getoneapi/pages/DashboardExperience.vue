<template>
  <div data-ui="dashboard-experience" class="g1-dashboard">
    <section data-ui="balance-health" class="g1-dashboard__row">
      <div v-if="loading" class="g1-skeleton-block" />
      <div v-else class="g1-dashboard__metrics">
        <div class="g1-metric">
          <span class="g1-metric__label">{{ t('getoneapi.dashboard.balance') }}</span>
          <span class="g1-metric__value">{{ balanceText }}</span>
        </div>
        <div class="g1-metric">
          <span class="g1-metric__label">{{ t('getoneapi.dashboard.requestsToday') }}</span>
          <span class="g1-metric__value">{{ stats?.today_requests ?? '—' }}</span>
        </div>
        <div class="g1-metric">
          <span class="g1-metric__label">{{ t('getoneapi.dashboard.activeKeys') }}</span>
          <span class="g1-metric__value">{{ stats?.active_api_keys ?? '—' }}</span>
        </div>
      </div>
      <div v-if="!loading && stats" class="g1-dashboard__health">
        <span
          class="g1-health-dot"
          :class="healthClass"
          aria-hidden="true"
        />
        <span class="g1-health-label">{{ healthLabel }}</span>
      </div>
    </section>

    <section data-ui="first-request-checklist" class="g1-dashboard__section">
      <FirstRequestChecklist
        :facts="firstRequestFacts"
        @create-key="$emit('createKey')"
      />
    </section>

    <section data-ui="quick-actions" class="g1-dashboard__section">
      <h3 class="g1-section-title">{{ t('getoneapi.dashboard.quickActions') }}</h3>
      <div class="g1-actions">
        <button
          type="button"
          data-ui="action-create-key"
          class="g1-action-card"
          @click="$emit('createKey')"
        >
          <Icon name="key" size="lg" aria-hidden="true" />
          <span>{{ t('getoneapi.dashboard.createKey') }}</span>
        </button>
        <router-link to="/purchase" class="g1-action-card">
          <Icon name="creditCard" size="lg" aria-hidden="true" />
          <span>{{ t('getoneapi.dashboard.topUp') }}</span>
        </router-link>
        <router-link to="/available-channels" class="g1-action-card">
          <Icon name="server" size="lg" aria-hidden="true" />
          <span>{{ t('getoneapi.dashboard.services') }}</span>
        </router-link>
      </div>
    </section>

    <section data-ui="usage-trend" class="g1-dashboard__section">
      <h3 class="g1-section-title">{{ t('getoneapi.dashboard.recentActivity') }}</h3>
      <div v-if="!stats" class="g1-empty-note">
        <p>{{ t('getoneapi.dashboard.noActivity') }}</p>
        <button
          type="button"
          data-variant="primary"
          data-ui="action-create-key"
          @click="$emit('createKey')"
        >
          {{ t('getoneapi.dashboard.createYourFirstKey') }}
        </button>
      </div>
      <p v-else-if="loadingCharts" class="g1-empty-note">{{ t('getoneapi.dashboard.loadingCharts') }}</p>
      <div v-else-if="trend?.length" class="g1-trend-summary">
        <p class="g1-trend-text">
          {{ trend.length }} data points loaded.
          <button type="button" class="g1-link-btn" @click="$emit('rangeChange')">Change date range</button>
        </p>
      </div>
      <div v-else class="g1-empty-note">
        <p>{{ t('getoneapi.dashboard.noRecentUsage') }}</p>
      </div>
    </section>

    <section data-ui="recent-requests" class="g1-dashboard__section">
      <h3 class="g1-section-title">{{ t('getoneapi.dashboard.recentRequests') }}</h3>
      <div v-if="loadingUsage" class="g1-table-skeleton">
        <div v-for="r in 3" :key="r" class="g1-table-row-skel" />
      </div>
      <div v-else-if="!recentUsage?.length" class="g1-empty-note">
        <p>{{ t('getoneapi.dashboard.noRequests') }}</p>
      </div>
      <table v-else class="g1-simple-table">
        <thead>
          <tr>
            <th>{{ t('getoneapi.dashboard.model') }}</th>
            <th>{{ t('getoneapi.dashboard.tokens') }}</th>
            <th>{{ t('getoneapi.dashboard.cost') }}</th>
            <th>{{ t('getoneapi.dashboard.time') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in recentUsage" :key="item.id">
            <td class="truncate max-w-[140px]">{{ item.model || '—' }}</td>
            <td class="tabular-nums">{{ item.input_tokens + item.output_tokens }}</td>
            <td class="tabular-nums">{{ formatCost(item.actual_cost) }}</td>
            <td class="tabular-nums">{{ formatTime(item.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import FirstRequestChecklist from '@/getoneapi/components/onboarding/FirstRequestChecklist.vue'
import type { FirstRequestFacts } from '@/getoneapi/adapters/firstRequestProgress'
import type { UserDashboardStats } from '@/api/usage'
import type { User, TrendDataPoint, ModelStat, UsageLog, PlatformQuotaItem } from '@/types'

const { t } = useI18n()

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
  {
    platformQuotas: null,
    trend: null,
    models: null,
    recentUsage: null,
    healthStatus: 'unknown',
  },
)

defineEmits<{
  createKey: []
  refresh: []
  rangeChange: []
}>()

const balanceText = computed(() => {
  if (!props.user?.balance) return '—'
  return `$${props.user.balance.toFixed(2)}`
})

const healthClass = computed(() => {
  if (props.healthStatus === 'operational') return 'g1-health-dot--ok'
  return 'g1-health-dot--unknown'
})

const healthLabel = computed(() => {
  if (props.healthStatus === 'operational') return t('getoneapi.dashboard.statusOperational')
  return t('getoneapi.dashboard.statusUnknown')
})

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

.g1-dashboard__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.g1-dashboard__metrics {
  display: flex;
  gap: 32px;
}

.g1-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.g1-metric__label {
  font-size: 13px;
  color: var(--g1-text-secondary);
}

.g1-metric__value {
  font-size: 24px;
  font-weight: 700;
  color: var(--g1-text);
  font-variant-numeric: tabular-nums;
}

.g1-dashboard__health {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--g1-text-secondary);
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

.g1-dashboard__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.g1-section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--g1-text);
}

.g1-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.g1-action-card {
  display: flex;
  min-height: 56px;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--g1-radius-md);
  border: 1px solid var(--g1-divider);
  background: var(--g1-surface);
  color: var(--g1-text);
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background 150ms ease;
}

.g1-action-card:hover {
  background: var(--g1-control);
}

.g1-empty-note {
  padding: 32px;
  border: 1px solid var(--g1-divider);
  border-radius: var(--g1-radius-md);
  text-align: center;
  color: var(--g1-text-secondary);
}

.g1-empty-note p {
  margin: 0;
  font-size: 15px;
}

.g1-empty-note button {
  margin-top: 12px;
}

.g1-skeleton-block {
  height: 56px;
  width: 100%;
  border-radius: var(--g1-radius-sm);
  background: var(--g1-control);
}

.g1-table-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.g1-table-row-skel {
  height: 40px;
  width: 100%;
  border-radius: var(--g1-radius-sm);
  background: var(--g1-control);
}

.g1-simple-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--g1-divider);
  border-radius: var(--g1-radius-md);
  overflow: hidden;
}

.g1-simple-table th,
.g1-simple-table td {
  padding: 10px 16px;
  font-size: 14px;
  text-align: left;
  border-bottom: 1px solid var(--g1-divider);
}

.g1-simple-table th {
  background: var(--g1-control);
  color: var(--g1-text-secondary);
  font-weight: 600;
}

.g1-simple-table td {
  color: var(--g1-text);
}

.g1-simple-table tr:last-child td {
  border-bottom: none;
}

.g1-trend-text {
  margin: 0;
  color: var(--g1-text-secondary);
  font-size: 14px;
}

.g1-link-btn {
  min-height: auto;
  padding: 0;
  background: none;
  color: var(--g1-link);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
