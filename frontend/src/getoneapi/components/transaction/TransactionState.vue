<template>
  <section
    class="g1-transaction-state"
    :data-transaction-state="state"
    role="status"
    aria-live="polite"
  >
    <div class="g1-transaction-state__icon" aria-hidden="true">
      <svg v-if="isProcessing" class="g1-transaction-state__spinner" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25" />
        <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      </svg>
      <Icon v-else-if="state === 'succeeded'" name="checkCircle" size="xl" />
      <Icon v-else-if="state === 'failed' || state === 'cancelled' || state === 'expired'" name="xCircle" size="xl" />
    </div>

    <h2 class="g1-transaction-state__title">{{ titleText }}</h2>

    <p v-if="stateDescription" class="g1-transaction-state__desc">{{ stateDescription }}</p>

    <dl v-if="amount || orderId" class="g1-transaction-state__details">
      <div v-if="orderId">
        <dt>{{ t('getoneapi.transaction.orderLabel') }}</dt>
        <dd class="tabular-nums">#{{ orderId }}</dd>
      </div>
      <div v-if="amount">
        <dt>{{ t('getoneapi.transaction.amountLabel') }}</dt>
        <dd class="tabular-nums">{{ formattedAmount }}</dd>
      </div>
    </dl>

    <div v-if="retryable || state === 'succeeded'" class="g1-transaction-state__actions">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()

export type TransactionStateValue =
  | 'creating'
  | 'awaiting-payment'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'expired'

const props = withDefaults(
  defineProps<{
    state: TransactionStateValue
    amount?: number
    currency?: string
    orderId?: string
    retryable?: boolean
  }>(),
  { amount: 0, currency: 'USD', orderId: '', retryable: false },
)

const isProcessing = computed(
  () => props.state === 'creating' || props.state === 'awaiting-payment' || props.state === 'processing',
)

const titleText = computed(() => {
  const titles: Record<TransactionStateValue, string> = {
    creating: t('getoneapi.transaction.creating'),
    'awaiting-payment': t('getoneapi.transaction.awaitingPayment'),
    processing: t('getoneapi.transaction.processing'),
    succeeded: t('getoneapi.transaction.succeeded'),
    failed: t('getoneapi.transaction.failed'),
    cancelled: t('getoneapi.transaction.cancelled'),
    expired: t('getoneapi.transaction.expired'),
  }
  return titles[props.state]
})

const stateDescription = computed(() => {
  const descriptions: Record<TransactionStateValue, string> = {
    creating: t('getoneapi.transaction.creatingDesc'),
    'awaiting-payment': t('getoneapi.transaction.awaitingPaymentDesc'),
    processing: t('getoneapi.transaction.processingDesc'),
    succeeded: '',
    failed: t('getoneapi.transaction.failedDesc'),
    cancelled: t('getoneapi.transaction.cancelledDesc'),
    expired: t('getoneapi.transaction.expiredDesc'),
  }
  return descriptions[props.state]
})

const formattedAmount = computed(() => {
  if (!props.amount) return ''
  return `${props.currency} ${props.amount.toFixed(2)}`
})
</script>

<style scoped>
.g1-transaction-state {
  padding: 40px 24px;
  text-align: center;
}

.g1-transaction-state__icon {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

[data-transaction-state='succeeded'] .g1-transaction-state__icon {
  color: var(--g1-success);
}

[data-transaction-state='failed'] .g1-transaction-state__icon,
[data-transaction-state='cancelled'] .g1-transaction-state__icon,
[data-transaction-state='expired'] .g1-transaction-state__icon {
  color: var(--g1-danger);
}

[data-transaction-state='creating'] .g1-transaction-state__icon,
[data-transaction-state='awaiting-payment'] .g1-transaction-state__icon,
[data-transaction-state='processing'] .g1-transaction-state__icon {
  color: var(--g1-primary);
}

.g1-transaction-state__spinner {
  width: 48px;
  height: 48px;
  animation: g1-trans-spin 1s linear infinite;
}

@keyframes g1-trans-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.g1-transaction-state__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--g1-text);
}

.g1-transaction-state__desc {
  max-width: 48ch;
  margin: 12px auto 0;
  color: var(--g1-text-secondary);
  font-size: var(--g1-text-base);
  line-height: 1.6;
}

.g1-transaction-state__details {
  display: inline-grid;
  grid-template-columns: auto auto;
  gap: 8px 16px;
  margin: 24px auto 0;
  padding: 16px 24px;
  border: 1px solid var(--g1-divider);
  border-radius: var(--g1-radius-md);
  background: var(--g1-surface);
  text-align: left;
}

.g1-transaction-state__details dt {
  font-size: var(--g1-text-sm);
  font-weight: 600;
  color: var(--g1-text-secondary);
}

.g1-transaction-state__details dd {
  font-size: var(--g1-text-base);
  font-weight: 600;
  color: var(--g1-text);
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.g1-transaction-state__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--g1-space-3);
  margin-top: 24px;
}
</style>
