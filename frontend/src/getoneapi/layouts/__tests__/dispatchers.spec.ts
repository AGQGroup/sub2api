import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AppLayout from '@/components/layout/AppLayout.vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import HomeView from '@/views/HomeView.vue'
import GetOneAPIAuthLayout from '@/getoneapi/layouts/GetOneAPIAuthLayout.vue'
import GetOneAPIPublicLayout from '@/getoneapi/layouts/GetOneAPIPublicLayout.vue'
import GetOneAPIUserLayout from '@/getoneapi/layouts/GetOneAPIUserLayout.vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import type { PublicSettings, User } from '@/types'

const replayTour = vi.fn()

const LegacyAppLayoutStub = defineComponent({
  name: 'LegacyAppLayout',
  setup(_, { expose, slots }) {
    expose({ replayTour })
    return () => h('div', { 'data-testid': 'legacy-app-layout' }, slots.default?.())
  }
})

const GetOneAPIUserLayoutStub = defineComponent({
  name: 'GetOneAPIUserLayout',
  setup(_, { slots }) {
    return () =>
      h(
        'div',
        { 'data-testid': 'getoneapi-user-layout', 'data-surface': 'getoneapi-user' },
        slots.default?.()
      )
  }
})

const LegacyAuthLayoutStub = defineComponent({
  name: 'LegacyAuthLayout',
  setup(_, { slots }) {
    return () =>
      h('div', { 'data-testid': 'legacy-auth-layout' }, [
        slots.default?.(),
        slots.footer?.()
      ])
  }
})

const GetOneAPIAuthLayoutStub = defineComponent({
  name: 'GetOneAPIAuthLayout',
  setup(_, { slots }) {
    return () =>
      h(
        'div',
        { 'data-testid': 'getoneapi-auth-layout', 'data-surface': 'getoneapi-auth' },
        [slots.default?.(), slots.footer?.()]
      )
  }
})

const LegacyHomeViewStub = defineComponent({
  name: 'LegacyHomeView',
  template: '<div data-testid="legacy-home-view" />'
})

const PublicHomePageStub = defineComponent({
  name: 'PublicHomePage',
  template:
    '<div data-testid="getoneapi-public-home" data-surface="getoneapi-public" />'
})

function setSurfaceState(pinia: Pinia, enabled: boolean, role: 'user' | 'admin' = 'user') {
  const appStore = useAppStore(pinia)
  const authStore = useAuthStore(pinia)

  appStore.cachedPublicSettings = {
    getoneapi_user_ui_enabled: enabled
  } as PublicSettings
  authStore.user = { role } as User
}

function mountAppLayout(pinia: Pinia): VueWrapper {
  return mount(AppLayout, {
    slots: { default: '<span data-testid="app-content">content</span>' },
    global: {
      plugins: [pinia],
      stubs: {
        LegacyAppLayout: LegacyAppLayoutStub,
        GetOneAPIUserLayout: GetOneAPIUserLayoutStub
      }
    }
  })
}

function mountAuthLayout(pinia: Pinia): VueWrapper {
  return mount(AuthLayout, {
    slots: {
      default: '<span data-testid="auth-content">content</span>',
      footer: '<span data-testid="auth-footer">footer</span>'
    },
    global: {
      plugins: [pinia],
      stubs: {
        LegacyAuthLayout: LegacyAuthLayoutStub,
        GetOneAPIAuthLayout: GetOneAPIAuthLayoutStub
      }
    }
  })
}

function mountHomeView(pinia: Pinia): VueWrapper {
  return mount(HomeView, {
    global: {
      plugins: [pinia],
      stubs: {
        LegacyHomeView: LegacyHomeViewStub,
        PublicHomePage: PublicHomePageStub
      }
    }
  })
}

describe('GetOneAPI surface dispatchers', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    replayTour.mockReset()
  })

  it('keeps regular users on the legacy app layout when the flag is disabled', () => {
    setSurfaceState(pinia, false, 'user')

    const wrapper = mountAppLayout(pinia)

    expect(wrapper.find('[data-testid="legacy-app-layout"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="app-content"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-surface]')).toHaveLength(0)
  })

  it('uses the GetOneAPI user layout for regular users when the flag is enabled', () => {
    setSurfaceState(pinia, true, 'user')

    const wrapper = mountAppLayout(pinia)

    expect(wrapper.findAll('[data-surface]')).toHaveLength(1)
    expect(wrapper.get('[data-surface]').attributes('data-surface')).toBe('getoneapi-user')
    expect(wrapper.find('[data-testid="app-content"]').exists()).toBe(true)
  })

  it('always keeps administrators on the legacy app layout', () => {
    setSurfaceState(pinia, true, 'admin')

    const wrapper = mountAppLayout(pinia)

    expect(wrapper.find('[data-testid="legacy-app-layout"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-surface]')).toHaveLength(0)
  })

  it('forwards replayTour from the selected app layout', () => {
    setSurfaceState(pinia, false, 'user')
    const wrapper = mountAppLayout(pinia)

    ;(wrapper.vm as unknown as { replayTour: () => void }).replayTour()

    expect(replayTour).toHaveBeenCalledOnce()
  })

  it('keeps the legacy auth layout surface-free when the flag is disabled', () => {
    setSurfaceState(pinia, false)

    const wrapper = mountAuthLayout(pinia)

    expect(wrapper.find('[data-testid="legacy-auth-layout"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="auth-content"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="auth-footer"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-surface]')).toHaveLength(0)
  })

  it('uses exactly the GetOneAPI auth surface when the flag is enabled', () => {
    setSurfaceState(pinia, true)

    const wrapper = mountAuthLayout(pinia)

    expect(wrapper.findAll('[data-surface]')).toHaveLength(1)
    expect(wrapper.get('[data-surface]').attributes('data-surface')).toBe('getoneapi-auth')
    expect(wrapper.find('[data-testid="auth-footer"]').exists()).toBe(true)
  })

  it('keeps the legacy public home surface-free when the flag is disabled', () => {
    setSurfaceState(pinia, false)

    const wrapper = mountHomeView(pinia)

    expect(wrapper.find('[data-testid="legacy-home-view"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-surface]')).toHaveLength(0)
  })

  it('uses exactly the GetOneAPI public surface when the flag is enabled', () => {
    setSurfaceState(pinia, true)

    const wrapper = mountHomeView(pinia)

    expect(wrapper.findAll('[data-surface]')).toHaveLength(1)
    expect(wrapper.get('[data-surface]').attributes('data-surface')).toBe('getoneapi-public')
  })

  it.each([
    [GetOneAPIPublicLayout, 'getoneapi-public'],
    [GetOneAPIAuthLayout, 'getoneapi-auth'],
    [GetOneAPIUserLayout, 'getoneapi-user']
  ])('sets exactly one outer surface on %s', (Layout, surface) => {
    const wrapper = mount(Layout, {
      slots: { default: '<div data-testid="layout-content" />' },
      global: { plugins: [pinia] }
    })

    expect(wrapper.findAll('[data-surface]')).toHaveLength(1)
    expect(wrapper.get('[data-surface]').attributes('data-surface')).toBe(surface)
    expect(wrapper.find('[data-testid="layout-content"]').exists()).toBe(true)
  })
})
