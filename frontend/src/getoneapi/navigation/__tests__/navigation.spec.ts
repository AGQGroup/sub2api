import { beforeEach, describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/i18n'
import UserSidebar from '../UserSidebar.vue'
import UserBottomNav from '../UserBottomNav.vue'
import UserHeader from '../UserHeader.vue'
import { coreUserNavigation } from '../items'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/dashboard', component: { template: '<div>Dashboard</div>' }, meta: { title: 'Dashboard' } },
    { path: '/keys', component: { template: '<div>Keys</div>' }, meta: { title: 'Keys' } },
    { path: '/usage', component: { template: '<div>Usage</div>' }, meta: { title: 'Usage' } },
    { path: '/available-channels', component: { template: '<div>Channels</div>' }, meta: { title: 'Available Channels' } },
    { path: '/profile', component: { template: '<div>Profile</div>' }, meta: { title: 'Profile' } },
    { path: '/purchase', component: { template: '<div>Purchase</div>' }, meta: { title: 'Purchase' } },
    { path: '/subscriptions', component: { template: '<div>Subscriptions</div>' }, meta: { title: 'Subscriptions' } },
    { path: '/redeem', component: { template: '<div>Redeem</div>' }, meta: { title: 'Redeem' } },
    { path: '/affiliate', component: { template: '<div>Affiliate</div>' }, meta: { title: 'Affiliate' } },
    { path: '/monitor', component: { template: '<div>Monitor</div>' }, meta: { title: 'Monitor' } },
    { path: '/batch-image', component: { template: '<div>Batch</div>' }, meta: { title: 'Batch Image' } },
    { path: '/orders', component: { template: '<div>Orders</div>' }, meta: { title: 'Orders' } },
  ],
})

async function navigate(path: string) {
  await router.push(path)
  await router.isReady()
}

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

describe('coreUserNavigation items', () => {
  it('defines exactly five core destinations', () => {
    expect(coreUserNavigation).toHaveLength(5)
  })

  it('maps dashboard, keys, usage, services, and account', () => {
    const paths = coreUserNavigation.map((i) => i.path)
    expect(paths).toEqual([
      '/dashboard',
      '/keys',
      '/usage',
      '/available-channels',
      '/profile',
    ])
  })

  it('assigns an icon to every item', () => {
    for (const item of coreUserNavigation) {
      expect(item.icon).toBeTruthy()
    }
  })

  it('uses getoneapi.nav.* label keys', () => {
    const keys = coreUserNavigation.map((i) => i.labelKey)
    expect(keys).toEqual([
      'getoneapi.nav.overview',
      'getoneapi.nav.keys',
      'getoneapi.nav.usage',
      'getoneapi.nav.services',
      'getoneapi.nav.account',
    ])
  })
})

describe('UserSidebar', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await navigate('/dashboard')
  })

  it('renders all core navigation items', async () => {
    const wrapper = mount(UserSidebar, mountOptions())
    await flushPromises()
    const links = wrapper.findAll('[data-ui="nav-item"]')
    expect(links.length).toBeGreaterThanOrEqual(5)
  })

  it('marks the active route with active class', async () => {
    await navigate('/keys')
    const wrapper = mount(UserSidebar, mountOptions())
    await flushPromises()
    const active = wrapper.find('[data-ui="nav-item"].g1-sidebar__link--active')
    expect(active.exists()).toBe(true)
    expect(active.attributes('to')).toBe('/keys')
  })

  it('has accessible names on icon-only controls', () => {
    const wrapper = mount(UserSidebar, mountOptions())
    const iconButtons = wrapper.findAll('[aria-label]')
    expect(iconButtons.length).toBeGreaterThan(0)
    for (const btn of iconButtons) {
      expect(btn.attributes('aria-label')).toBeTruthy()
    }
  })
})

describe('UserBottomNav', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await navigate('/dashboard')
  })

  it('renders all five core navigation items', async () => {
    const wrapper = mount(UserBottomNav, mountOptions())
    await flushPromises()
    const links = wrapper.findAll('[data-ui="bottom-nav-item"]')
    expect(links).toHaveLength(5)
  })

  it('marks the active route', async () => {
    await navigate('/keys')
    const wrapper = mount(UserBottomNav, mountOptions())
    await flushPromises()
    const active = wrapper.find('[data-ui="bottom-nav-item"].g1-bottom-nav__link--active')
    expect(active.exists()).toBe(true)
  })

  it('uses safe-area-inset-bottom in style', () => {
    const wrapper = mount(UserBottomNav, mountOptions())
    const nav = wrapper.find('[data-ui="user-bottom-nav"]')
    const style = nav.attributes('style')
    expect(style).toContain('safe-area-inset-bottom')
  })

  it('has accessible names on navigation links', () => {
    const wrapper = mount(UserBottomNav, mountOptions())
    const links = wrapper.findAll('[data-ui="bottom-nav-item"]')
    for (const link of links) {
      expect(link.attributes('aria-label')).toBeTruthy()
    }
  })
})

describe('UserHeader', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await navigate('/dashboard')
  })

  it('renders the theme mode control', () => {
    const wrapper = mount(UserHeader, mountOptions())
    expect(wrapper.find('[data-theme-mode]').exists()).toBe(true)
  })

  it('has a visible page title area', () => {
    const wrapper = mount(UserHeader, mountOptions())
    expect(wrapper.find('[data-ui="user-page-title"]').exists()).toBe(true)
  })

  it('displays the route page title', () => {
    const wrapper = mount(UserHeader, mountOptions())
    expect(wrapper.find('[data-ui="user-page-title"]').text()).toContain('Dashboard')
  })
})
