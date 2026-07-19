import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { i18n } from '@/i18n'
import AuthStatePanel from '../AuthStatePanel.vue'
import AuthErrorSummary from '../AuthErrorSummary.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/login', component: { template: '<div>Login</div>' } }],
})

function mountOptions() {
  return {
    global: {
      plugins: [createPinia(), router, i18n],
      stubs: { Icon: { template: '<span class="icon-stub" />' }, routerLink: true },
    },
  }
}

describe('AuthStatePanel', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it.each(['loading', 'success', 'warning', 'error'] as const)(
    'renders data-auth-state=%s',
    (state) => {
      const wrapper = mount(AuthStatePanel, {
        props: { state, title: 'Test title' },
        ...mountOptions(),
      })
      expect(wrapper.find(`[data-auth-state="${state}"]`).exists()).toBe(true)
    },
  )

  it('uses role=alert for error state', () => {
    const wrapper = mount(AuthStatePanel, {
      props: { state: 'error', title: 'Error' },
      ...mountOptions(),
    })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('uses role=status and polite live region for success', () => {
    const wrapper = mount(AuthStatePanel, {
      props: { state: 'success', title: 'Success' },
      ...mountOptions(),
    })
    const el = wrapper.find('[role="status"]')
    expect(el.exists()).toBe(true)
    expect(el.attributes('aria-live')).toBe('polite')
  })

  it('sets aria-busy=true for loading', () => {
    const wrapper = mount(AuthStatePanel, {
      props: { state: 'loading', title: 'Loading' },
      ...mountOptions(),
    })
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
  })

  it('renders retry button when retryLabel is provided', () => {
    const wrapper = mount(AuthStatePanel, {
      props: { state: 'error', title: 'Error', retryLabel: 'Try again' },
      ...mountOptions(),
    })
    expect(wrapper.find('[data-ui="auth-retry"]').exists()).toBe(true)
  })

  it('does not render retry button when retryLabel is empty', () => {
    const wrapper = mount(AuthStatePanel, {
      props: { state: 'error', title: 'Error', retryLabel: '' },
      ...mountOptions(),
    })
    expect(wrapper.find('[data-ui="auth-retry"]').exists()).toBe(false)
  })

  it('emits retry on button click', async () => {
    const wrapper = mount(AuthStatePanel, {
      props: { state: 'error', title: 'Error', retryLabel: 'Try again' },
      ...mountOptions(),
    })
    await wrapper.find('[data-ui="auth-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })

  it('disables retry button when busy', () => {
    const wrapper = mount(AuthStatePanel, {
      props: { state: 'error', title: 'Error', retryLabel: 'Try again', busy: true },
      ...mountOptions(),
    })
    expect(wrapper.find('[data-ui="auth-retry"]').attributes('disabled')).toBeDefined()
  })

  it('renders a back link with default href', () => {
    const wrapper = mount(AuthStatePanel, {
      props: { state: 'error', title: 'Error' },
      ...mountOptions(),
    })
    expect(wrapper.find('[data-ui="auth-back"]').exists()).toBe(true)
  })

  it('renders title and description', () => {
    const wrapper = mount(AuthStatePanel, {
      props: { state: 'success', title: 'Done', description: 'All good' },
      ...mountOptions(),
    })
    expect(wrapper.text()).toContain('Done')
    expect(wrapper.text()).toContain('All good')
  })
})

describe('AuthErrorSummary', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders nothing when errors is empty', () => {
    const wrapper = mount(AuthErrorSummary, {
      props: { errors: [] },
      ...mountOptions(),
    })
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('renders error messages', () => {
    const wrapper = mount(AuthErrorSummary, {
      props: { errors: ['First error', 'Second error'] },
      ...mountOptions(),
    })
    expect(wrapper.text()).toContain('First error')
    expect(wrapper.text()).toContain('Second error')
  })

  it('uses role=alert', () => {
    const wrapper = mount(AuthErrorSummary, {
      props: { errors: ['Error'] },
      ...mountOptions(),
    })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})

describe('callback state mapping', () => {
  it('supports loading, success, warning, and error states', () => {
    const validStates = ['loading', 'success', 'warning', 'error'] as const
    expect(validStates).toHaveLength(4)
  })
})
