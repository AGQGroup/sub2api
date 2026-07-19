import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { i18n } from '@/i18n'
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
        [
          slots.default?.(),
          slots.footer ? h('footer', { 'data-testid': 'auth-footer-landmark' }, slots.footer()) : null
        ]
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

const RouteFixture = defineComponent({
  name: 'RouteFixture',
  template: '<div />'
})

function createFixtureRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/user-fixture',
        component: RouteFixture,
        meta: { requiresAdmin: false }
      },
      {
        path: '/admin-fixture',
        component: RouteFixture,
        meta: { requiresAdmin: true }
      }
    ]
  })
}

function mountAppLayout(pinia: Pinia, router: Router): VueWrapper {
  return mount(AppLayout, {
    slots: { default: '<span data-testid="app-content">content</span>' },
    global: {
      plugins: [pinia, router],
      stubs: {
        LegacyAppLayout: LegacyAppLayoutStub,
        GetOneAPIUserLayout: GetOneAPIUserLayoutStub
      }
    }
  })
}

function mountAuthLayout(pinia: Pinia, withFooter = true): VueWrapper {
  return mount(AuthLayout, {
    slots: withFooter ? {
      default: '<span data-testid="auth-content">content</span>',
      footer: '<span data-testid="auth-footer">footer</span>'
    } : {
      default: '<span data-testid="auth-content">content</span>'
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
  let router: Router

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createFixtureRouter()
    await router.push('/user-fixture')
    await router.isReady()
    replayTour.mockReset()
  })

  it('keeps regular users on the legacy app layout when the flag is disabled', () => {
    setSurfaceState(pinia, false, 'user')

    const wrapper = mountAppLayout(pinia, router)

    expect(wrapper.find('[data-testid="legacy-app-layout"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="app-content"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-surface]')).toHaveLength(0)
  })

  it('uses the GetOneAPI user layout for regular users when the flag is enabled', () => {
    setSurfaceState(pinia, true, 'user')

    const wrapper = mountAppLayout(pinia, router)

    expect(wrapper.findAll('[data-surface]')).toHaveLength(1)
    expect(wrapper.get('[data-surface]').attributes('data-surface')).toBe('getoneapi-user')
    expect(wrapper.find('[data-testid="app-content"]').exists()).toBe(true)
  })

  it('always keeps administrators on the legacy app layout', () => {
    setSurfaceState(pinia, true, 'admin')

    const wrapper = mountAppLayout(pinia, router)

    expect(wrapper.find('[data-testid="legacy-app-layout"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-surface]')).toHaveLength(0)
  })

  it('forwards replayTour from the selected app layout', () => {
    setSurfaceState(pinia, false, 'user')
    const wrapper = mountAppLayout(pinia, router)

    ;(wrapper.vm as unknown as { replayTour: () => void }).replayTour()

    expect(replayTour).toHaveBeenCalledOnce()
  })

  it.each([
    ['a regular user', { role: 'user' } as User],
    ['no authenticated user', null]
  ])(
    'keeps an admin route on the legacy layout after the role changes to %s',
    async (_, nextUser) => {
      setSurfaceState(pinia, true, 'admin')
      await router.push('/admin-fixture')
      const wrapper = mountAppLayout(pinia, router)
      const authStore = useAuthStore(pinia)

      expect(wrapper.find('[data-testid="legacy-app-layout"]').exists()).toBe(true)

      authStore.user = nextUser
      await nextTick()

      expect(wrapper.find('[data-testid="legacy-app-layout"]').exists()).toBe(true)
      expect(wrapper.findAll('[data-surface]')).toHaveLength(0)
    }
  )

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

  it('does not create a footer when the caller does not provide the footer slot', () => {
    setSurfaceState(pinia, true)

    const wrapper = mountAuthLayout(pinia, false)

    expect(wrapper.find('footer').exists()).toBe(false)
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
    const router = createFixtureRouter()
    const wrapper = mount(Layout, {
      slots: { default: '<div data-testid="layout-content" />' },
      global: {
        plugins: [pinia, router, i18n],
        stubs: {
          UserSidebar: { template: '<div />' },
          UserBottomNav: { template: '<div />' },
          UserHeader: { template: '<div />' },
        }
      }
    })

    expect(wrapper.findAll('[data-surface]')).toHaveLength(1)
    expect(wrapper.get('[data-surface]').attributes('data-surface')).toBe(surface)
    expect(wrapper.find('[data-testid="layout-content"]').exists()).toBe(true)
  })
})
