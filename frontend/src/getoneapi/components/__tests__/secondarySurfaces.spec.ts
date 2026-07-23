import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/i18n'
import { resolveSurfaceError } from '@/getoneapi/adapters/surfaceError'
import DataState from '@/getoneapi/components/DataState.vue'
import SectionHeader from '@/getoneapi/components/SectionHeader.vue'
import DefinitionList from '@/getoneapi/components/DefinitionList.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import TransactionState from '@/getoneapi/components/transaction/TransactionState.vue'
import DashboardExperience from '@/getoneapi/pages/DashboardExperience.vue'

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

describe('shared component surface prop', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('EmptyState omits data-surface-variant on legacy default', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No data' },
      ...mountOptions(),
    })
    expect(wrapper.find('[data-surface-variant]').exists()).toBe(false)
    expect(wrapper.find('[data-ui="empty-state"]').exists()).toBe(true)
  })

  it('EmptyState renders data-surface-variant on getoneapi', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No data', surface: 'getoneapi' },
      ...mountOptions(),
    })
    expect(wrapper.find('[data-surface-variant="getoneapi"]').exists()).toBe(true)
    expect(wrapper.find('.g1-icon-backdrop').exists()).toBe(true)
  })
})

describe('resolveSurfaceError', () => {
  it('maps 403 to forbidden', () => {
    expect(resolveSurfaceError({ status: 403 })).toBe('forbidden')
  })

  it('maps 429 to rate-limited', () => {
    expect(resolveSurfaceError({ status: 429 })).toBe('rate-limited')
  })

  it('maps MAINTENANCE code to maintenance', () => {
    expect(resolveSurfaceError({ code: 'MAINTENANCE' })).toBe('maintenance')
  })

  it('maps SERVICE_UNAVAILABLE code to maintenance', () => {
    expect(resolveSurfaceError({ code: 'SERVICE_UNAVAILABLE' })).toBe('maintenance')
  })

  it('maps unknown errors to error', () => {
    expect(resolveSurfaceError({ status: 500 })).toBe('error')
  })

  it('treats undefined as error', () => {
    expect(resolveSurfaceError(undefined)).toBe('error')
  })

  it('treats null as error', () => {
    expect(resolveSurfaceError(null)).toBe('error')
  })

  it('treats generic 503 without maintenance code as error', () => {
    expect(resolveSurfaceError({ status: 503 })).toBe('error')
  })
})

describe('DataState', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it.each(['loading', 'empty', 'forbidden', 'rate-limited', 'maintenance', 'error'] as const)(
    'renders data-error-state=%s',
    (state) => {
      const wrapper = mount(DataState, {
        props: { state },
        ...mountOptions(),
      })
      expect(wrapper.find(`[data-error-state="${state}"]`).exists()).toBe(true)
    },
  )

  it('uses role=alert for error states', () => {
    const wrapper = mount(DataState, {
      props: { state: 'error', title: 'Error' },
      ...mountOptions(),
    })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('shows retry button when retryable', () => {
    const wrapper = mount(DataState, {
      props: { state: 'error', retryable: true, retryLabel: 'Try again' },
      ...mountOptions(),
    })
    expect(wrapper.find('[data-ui="data-state-retry"]').exists()).toBe(true)
  })

  it('emits retry on button click', async () => {
    const wrapper = mount(DataState, {
      props: { state: 'error', retryable: true, retryLabel: 'Try again' },
      ...mountOptions(),
    })
    await wrapper.find('[data-ui="data-state-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })

  it('renders title and message', () => {
    const wrapper = mount(DataState, {
      props: { state: 'error', title: 'Oops', message: 'Something went wrong' },
      ...mountOptions(),
    })
    expect(wrapper.text()).toContain('Oops')
    expect(wrapper.text()).toContain('Something went wrong')
  })
})

describe('SectionHeader', () => {
  it('renders title and description', () => {
    const wrapper = mount(SectionHeader, {
      props: { title: 'Usage', description: 'Your usage records' },
      ...mountOptions(),
    })
    expect(wrapper.text()).toContain('Usage')
    expect(wrapper.text()).toContain('Your usage records')
  })

  it('renders actions slot', () => {
    const wrapper = mount(SectionHeader, {
      props: { title: 'Title' },
      slots: { actions: '<button data-testid="action">Go</button>' },
      ...mountOptions(),
    })
    expect(wrapper.find('[data-testid="action"]').exists()).toBe(true)
  })
})

describe('DefinitionList', () => {
  it('renders term-definition pairs', () => {
    const items = [
      { term: 'Name', definition: 'John' },
      { term: 'Email', definition: 'john@example.com' },
    ]
    const wrapper = mount(DefinitionList, {
      props: { items },
      ...mountOptions(),
    })
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('John')
    expect(wrapper.text()).toContain('Email')
    expect(wrapper.text()).toContain('john@example.com')
  })

  it('renders empty when no items', () => {
    const wrapper = mount(DefinitionList, {
      props: { items: [] },
      ...mountOptions(),
    })
    expect(wrapper.find('dt').exists()).toBe(false)
  })
})

describe('long content handling (plan Step 4)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  const LONG_MODEL = 'claude-opus-4-5-extended-preview-with-very-long-model-identifier-suffix-2026-experimental-v2-rc1-prod'
  const LONG_ORDER_ID = 'sub2_order_20260719abcdef1234567890ABCDEF0987654321zyxwvutsrqponmlkjihgfedcba_long_identifier_extreme_length_120chars_xxx'

  it('TransactionState renders 120-char order ID with tabular-nums and wrap', () => {
    expect(LONG_MODEL.length).toBeGreaterThanOrEqual(100)
    const wrapper = mount(TransactionState, {
      props: { state: 'succeeded', orderId: LONG_ORDER_ID, amount: 10, currency: 'USD' },
      ...mountOptions(),
    })
    expect(LONG_ORDER_ID.length).toBeGreaterThanOrEqual(120)
    const dd = wrapper.find('.g1-transaction-state__details dd')
    expect(dd.exists()).toBe(true)
    expect(dd.text()).toContain(LONG_ORDER_ID.slice(0, 20))
    expect(dd.classes()).toContain('tabular-nums')
  })

  it('DashboardExperience truncates 100-char model name in table cell', () => {
    const wrapper = mount(DashboardExperience, {
      props: {
        stats: { total_api_keys: 1, active_api_keys: 1, total_requests: 1, today_requests: 1 } as any,
        user: { balance: 1, role: 'user' } as any,
        loading: false,
        loadingCharts: false,
        loadingUsage: false,
        firstRequestFacts: { keyCount: 1, configurationOpened: true, totalRequests: 1 },
        recentUsage: [{
          id: 1,
          model: LONG_MODEL,
          input_tokens: 10,
          output_tokens: 5,
          actual_cost: 0.001,
          created_at: '2026-07-19T10:00:00Z',
        }] as any,
      },
      ...mountOptions(),
    })
    const cell = wrapper.find('.g1-table__model')
    expect(cell.exists()).toBe(true)
    expect(cell.text()).toBe(LONG_MODEL)
    expect(cell.attributes('style') ?? '').not.toContain('font-size: 1vw')
  })

  it('surfaces.css declares overflow-wrap for identifiers', () => {
    const css = readFileSync(
      resolve(__dirname, '../../theme/surfaces.css'),
      'utf-8',
    )
    expect(css).toContain('overflow-wrap: anywhere')
    expect(css).toContain("[data-identifier]")
  })

  it('surfaces.css keeps primary actions un-hidden at small sizes (44px min-height rule)', () => {
    const css = readFileSync(
      resolve(__dirname, '../../theme/surfaces.css'),
      'utf-8',
    )
    expect(css).toContain('[data-surface^=\'getoneapi-\'] button')
    expect(css).toContain('min-height: 44px')
  })
})
