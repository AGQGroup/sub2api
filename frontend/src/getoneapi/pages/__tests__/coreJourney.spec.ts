import { describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/i18n'
import {
  resolveFirstRequestProgress,
  type FirstRequestFacts,
} from '@/getoneapi/adapters/firstRequestProgress'
import FirstRequestChecklist from '@/getoneapi/components/onboarding/FirstRequestChecklist.vue'
import KeyEmptyState from '@/getoneapi/components/onboarding/KeyEmptyState.vue'
import DashboardExperience from '@/getoneapi/pages/DashboardExperience.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/keys', component: { template: '<div>Keys</div>' } },
    { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/purchase', component: { template: '<div>Purchase</div>' } },
    { path: '/available-channels', component: { template: '<div>Channels</div>' } },
  ],
})

function mountOptions() {
  return {
    global: {
      plugins: [createPinia(), router, i18n],
      stubs: {
        Icon: { template: '<span class="icon-stub" />' },
        routerLink: true,
      },
    },
  }
}

describe('resolveFirstRequestProgress', () => {
  it('returns all steps incomplete with zero facts', () => {
    const facts: FirstRequestFacts = { keyCount: 0, configurationOpened: false, totalRequests: 0 }
    const result = resolveFirstRequestProgress(facts)
    expect(result[0]).toEqual({ id: 'key', complete: false, href: '/keys' })
    expect(result[1]).toEqual({ id: 'configure', complete: false, href: '/keys' })
    expect(result[2]).toEqual({ id: 'request', complete: false, href: '/dashboard' })
  })

  it('marks key complete when keyCount > 0', () => {
    const facts: FirstRequestFacts = { keyCount: 1, configurationOpened: false, totalRequests: 0 }
    const result = resolveFirstRequestProgress(facts)
    expect(result[0].complete).toBe(true)
    expect(result[1].complete).toBe(false)
    expect(result[2].complete).toBe(false)
  })

  it('marks configure complete when configurationOpened is true', () => {
    const facts: FirstRequestFacts = { keyCount: 1, configurationOpened: true, totalRequests: 0 }
    const result = resolveFirstRequestProgress(facts)
    expect(result[0].complete).toBe(true)
    expect(result[1].complete).toBe(true)
    expect(result[2].complete).toBe(false)
  })

  it('marks all complete with all facts satisfied', () => {
    const facts: FirstRequestFacts = { keyCount: 2, configurationOpened: true, totalRequests: 5 }
    const result = resolveFirstRequestProgress(facts)
    for (const step of result) {
      expect(step.complete).toBe(true)
    }
  })
})

describe('FirstRequestChecklist', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders three steps', () => {
    const wrapper = mount(FirstRequestChecklist, {
      props: { facts: { keyCount: 0, configurationOpened: false, totalRequests: 0 } },
      ...mountOptions(),
    })
    expect(wrapper.findAll('[data-ui^="checklist-"]').length).toBeGreaterThanOrEqual(3)
  })

  it('shows action links for incomplete steps', () => {
    const wrapper = mount(FirstRequestChecklist, {
      props: { facts: { keyCount: 0, configurationOpened: false, totalRequests: 0 } },
      ...mountOptions(),
    })
    expect(wrapper.findAll('[data-ui^="checklist-action-"]').length).toBe(3)
  })

  it('hides action links for complete steps', () => {
    const wrapper = mount(FirstRequestChecklist, {
      props: { facts: { keyCount: 1, configurationOpened: true, totalRequests: 5 } },
      ...mountOptions(),
    })
    expect(wrapper.findAll('[data-ui^="checklist-action-"]').length).toBe(0)
  })

  it('marks complete steps with data-complete attribute', () => {
    const wrapper = mount(FirstRequestChecklist, {
      props: { facts: { keyCount: 1, configurationOpened: false, totalRequests: 0 } },
      ...mountOptions(),
    })
    const keyStep = wrapper.find('[data-ui="checklist-key"]')
    expect(keyStep.attributes('data-complete')).toBe('true')
  })
})

describe('KeyEmptyState', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders a create button', () => {
    const wrapper = mount(KeyEmptyState, mountOptions())
    expect(wrapper.find('[data-ui="create-key"]').exists()).toBe(true)
  })

  it('emits createKey on button click', async () => {
    const wrapper = mount(KeyEmptyState, mountOptions())
    await wrapper.find('[data-ui="create-key"]').trigger('click')
    expect(wrapper.emitted('createKey')).toBeTruthy()
  })
})

describe('DashboardExperience', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the balance section when loaded', async () => {
    const wrapper = mount(DashboardExperience, {
      props: {
        stats: { total_api_keys: 1, active_api_keys: 1, total_requests: 0, today_requests: 0, today_actual_cost: 0, today_cost: 0 } as any,
        user: { balance: 25, role: 'user' } as any,
        loading: false,
        loadingCharts: false,
        loadingUsage: false,
        firstRequestFacts: { keyCount: 1, configurationOpened: false, totalRequests: 0 },
      },
      ...mountOptions(),
    })
    await flushPromises()
    expect(wrapper.text()).toContain('25.00')
  })

  it('shows the first-request checklist', async () => {
    const wrapper = mount(DashboardExperience, {
      props: {
        stats: { total_api_keys: 0, active_api_keys: 0, total_requests: 0, today_requests: 0, today_actual_cost: 0, today_cost: 0 } as any,
        user: { balance: 0, role: 'user' } as any,
        loading: false,
        loadingCharts: false,
        loadingUsage: false,
        firstRequestFacts: { keyCount: 0, configurationOpened: false, totalRequests: 0 },
      },
      ...mountOptions(),
    })
    await flushPromises()
    expect(wrapper.find('[data-ui="first-request-checklist"]').exists()).toBe(true)
  })

  it('renders quick action cards', async () => {
    const wrapper = mount(DashboardExperience, {
      props: {
        stats: { total_api_keys: 0, active_api_keys: 0, total_requests: 0, today_requests: 0, today_actual_cost: 0, today_cost: 0 } as any,
        user: null,
        loading: false,
        loadingCharts: false,
        loadingUsage: false,
        firstRequestFacts: { keyCount: 0, configurationOpened: false, totalRequests: 0 },
      },
      ...mountOptions(),
    })
    await flushPromises()
    expect(wrapper.find('[data-ui="action-create-key"]').exists()).toBe(true)
  })
})
