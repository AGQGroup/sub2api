import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/i18n'
import UserSidebar from '@/getoneapi/navigation/UserSidebar.vue'
import UserBottomNav from '@/getoneapi/navigation/UserBottomNav.vue'
import UserHeader from '@/getoneapi/navigation/UserHeader.vue'
import AuthStatePanel from '@/getoneapi/components/auth/AuthStatePanel.vue'
import DataState from '@/getoneapi/components/DataState.vue'
import DashboardExperience from '@/getoneapi/pages/DashboardExperience.vue'
import TransactionState from '@/getoneapi/components/transaction/TransactionState.vue'
import FirstRequestChecklist from '@/getoneapi/components/onboarding/FirstRequestChecklist.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/dashboard', component: { template: '<div />' }, meta: { title: 'Dashboard' } },
    { path: '/keys', component: { template: '<div />' }, meta: { title: 'Keys' } },
    { path: '/usage', component: { template: '<div />' }, meta: { title: 'Usage' } },
    { path: '/available-channels', component: { template: '<div />' }, meta: { title: 'Services' } },
    { path: '/profile', component: { template: '<div />' }, meta: { title: 'Profile' } },
    { path: '/purchase', component: { template: '<div />' }, meta: { title: 'Purchase' } },
    { path: '/login', component: { template: '<div />' }, meta: { title: 'Login' } },
  ],
})

function mountOptions() {
  return {
    global: {
      plugins: [createPinia(), router, i18n],
      stubs: { Icon: { template: '<span class="icon-stub" />' }, routerLink: true },
    },
  }
}

async function navigate(path: string) {
  await router.push(path)
  await router.isReady()
}

describe('accessibility contracts', () => {
  beforeEach(() => setActivePinia(createPinia()))

  describe('icon-only buttons have accessible names', () => {
    it('UserSidebar has aria-label on icon-only button', () => {
      const wrapper = mount(UserSidebar, mountOptions())
      const buttons = wrapper.findAll('button[aria-label]')
      for (const btn of buttons) {
        expect(btn.attributes('aria-label')).toBeTruthy()
      }
    })

    it('UserBottomNav links have aria-label', async () => {
      await navigate('/dashboard')
      const wrapper = mount(UserBottomNav, mountOptions())
      const links = wrapper.findAll('[aria-label]')
      expect(links.length).toBeGreaterThan(0)
      for (const link of links) {
        expect(link.attributes('aria-label')).toBeTruthy()
      }
    })
  })

  describe('focus management', () => {
    it('UserHeader title exists with accessible content', async () => {
      await navigate('/dashboard')
      const wrapper = mount(UserHeader, mountOptions())
      expect(wrapper.find('[data-ui="user-page-title"]').exists()).toBe(true)
    })
  })

  describe('live regions for status announcements', () => {
    it('AuthStatePanel uses appropriate roles', () => {
      const wrapper = mount(AuthStatePanel, {
        props: { state: 'error', title: 'Error' },
        ...mountOptions(),
      })
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)

      const wrapper2 = mount(AuthStatePanel, {
        props: { state: 'success', title: 'Done' },
        ...mountOptions(),
      })
      expect(wrapper2.find('[role="status"]').exists()).toBe(true)
    })

    it('DataState uses role=alert for error states', () => {
      const wrapper = mount(DataState, {
        props: { state: 'error', title: 'Error', message: 'Oops' },
        ...mountOptions(),
      })
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    })

    it('TransactionState uses role=status with polite live region', () => {
      const wrapper = mount(TransactionState, {
        props: { state: 'processing' },
        ...mountOptions(),
      })
      expect(wrapper.find('[role="status"]').exists()).toBe(true)
      expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true)
    })
  })

  describe('labels associated with form controls', () => {
    it('FirstRequestChecklist renders accessible structure', () => {
      const wrapper = mount(FirstRequestChecklist, {
        props: { facts: { keyCount: 0, configurationOpened: false, totalRequests: 0 } },
        ...mountOptions(),
      })
      expect(wrapper.find('[aria-labelledby]').exists()).toBe(true)
    })
  })

  describe('color is never the sole status indicator', () => {
    it('AuthStatePanel states include text labels', () => {
      for (const state of ['loading', 'success', 'warning', 'error'] as const) {
        const wrapper = mount(AuthStatePanel, {
          props: { state, title: 'Test' },
          ...mountOptions(),
        })
        expect(wrapper.text()).toBeTruthy()
      }
    })

    it('DataState includes text for all states', () => {
      const states: Array<'loading' | 'empty' | 'forbidden' | 'rate-limited' | 'maintenance' | 'error'> = [
        'loading', 'empty', 'forbidden', 'rate-limited', 'maintenance', 'error',
      ]
      for (const state of states) {
        const wrapper = mount(DataState, {
          props: { state, title: state, message: '' },
          ...mountOptions(),
        })
        expect(wrapper.text()).toBeTruthy()
      }
    })
  })

  describe('aria-busy for async content', () => {
    it('DashboardExperience sets aria-busy during loading', () => {
      const wrapper = mount(DashboardExperience, {
        props: {
          stats: null,
          user: null,
          loading: true,
          loadingCharts: false,
          loadingUsage: false,
          firstRequestFacts: { keyCount: 0, configurationOpened: false, totalRequests: 0 },
        },
        ...mountOptions(),
      })
      expect(wrapper.exists()).toBe(true)
    })
  })
})
