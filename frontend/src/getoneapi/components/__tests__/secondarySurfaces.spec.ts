import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/i18n'
import { resolveSurfaceError } from '@/getoneapi/adapters/surfaceError'
import DataState from '@/getoneapi/components/DataState.vue'
import SectionHeader from '@/getoneapi/components/SectionHeader.vue'
import DefinitionList from '@/getoneapi/components/DefinitionList.vue'
import EmptyState from '@/components/common/EmptyState.vue'

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
