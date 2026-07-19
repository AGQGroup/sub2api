import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { i18n } from '@/i18n'
import TransactionState from '../TransactionState.vue'
import type { TransactionStateValue } from '../TransactionState.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }],
})

function mountOptions() {
  return {
    global: {
      plugins: [createPinia(), router, i18n],
      stubs: { Icon: { template: '<span class="icon-stub" />' }, routerLink: true },
    },
  }
}

describe('TransactionState', () => {
  beforeEach(() => setActivePinia(createPinia()))

  const states: TransactionStateValue[] = [
    'creating',
    'awaiting-payment',
    'processing',
    'succeeded',
    'failed',
    'cancelled',
    'expired',
  ]

  it.each(states)('renders data-transaction-state=%s', (state) => {
    const wrapper = mount(TransactionState, {
      props: { state },
      ...mountOptions(),
    })
    expect(wrapper.find(`[data-transaction-state="${state}"]`).exists()).toBe(true)
  })

  it('shows amount and currency when provided', () => {
    const wrapper = mount(TransactionState, {
      props: { state: 'succeeded', amount: 29.99, currency: 'USD' },
      ...mountOptions(),
    })
    expect(wrapper.text()).toContain('29.99')
    expect(wrapper.text()).toContain('USD')
  })

  it('shows order ID when provided', () => {
    const wrapper = mount(TransactionState, {
      props: { state: 'succeeded', orderId: '12345' },
      ...mountOptions(),
    })
    expect(wrapper.text()).toContain('12345')
  })

  it('does not show amount details when not provided', () => {
    const wrapper = mount(TransactionState, {
      props: { state: 'succeeded' },
      ...mountOptions(),
    })
    expect(wrapper.find('dl').exists()).toBe(false)
  })

  it('renders actions slot', () => {
    const wrapper = mount(TransactionState, {
      props: { state: 'succeeded' },
      slots: { default: '<button data-testid="action">Continue</button>' },
      ...mountOptions(),
    })
    expect(wrapper.find('[data-testid="action"]').exists()).toBe(true)
  })

  it('renders spinner for processing states', () => {
    for (const state of ['creating', 'awaiting-payment', 'processing'] as const) {
      const wrapper = mount(TransactionState, {
        props: { state },
        ...mountOptions(),
      })
      expect(wrapper.find('svg.g1-transaction-state__spinner').exists()).toBe(true)
    }
  })

  it('uses role=status with polite live region', () => {
    const wrapper = mount(TransactionState, {
      props: { state: 'processing' },
      ...mountOptions(),
    })
    const el = wrapper.find('[role="status"]')
    expect(el.exists()).toBe(true)
    expect(el.attributes('aria-live')).toBe('polite')
  })

  it('shows success icon for succeeded state', () => {
    const wrapper = mount(TransactionState, {
      props: { state: 'succeeded' },
      ...mountOptions(),
    })
    expect(wrapper.find('.icon-stub').exists()).toBe(true)
  })

  it('applies the seven valid states without error', () => {
    for (const state of states) {
      const wrapper = mount(TransactionState, {
        props: { state },
        ...mountOptions(),
      })
      expect(wrapper.exists()).toBe(true)
    }
  })
})
