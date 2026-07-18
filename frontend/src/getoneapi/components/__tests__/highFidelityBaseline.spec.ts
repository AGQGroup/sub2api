import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import i18n from '@/i18n'
import type { PublicSettings } from '@/types'
import LoginView from '@/views/auth/LoginView.vue'
import { useAppStore } from '@/stores/app'
import type { PublicCatalog } from '@/getoneapi/catalog/types'
import BrandLockup from '@/getoneapi/components/BrandLockup.vue'
import CatalogPreview from '@/getoneapi/components/catalog/CatalogPreview.vue'
import GetOneAPIAuthLayout from '@/getoneapi/layouts/GetOneAPIAuthLayout.vue'
import GetOneAPIUserLayout from '@/getoneapi/layouts/GetOneAPIUserLayout.vue'
import LanguageMenu from '@/getoneapi/components/LanguageMenu.vue'
import ThemeModeControl from '@/getoneapi/components/ThemeModeControl.vue'
import { getPublicHealth } from '@/getoneapi/public/health'
import { getPublicLinks } from '@/getoneapi/content/publicLinks'

const { getPublicCatalogMock, getPublicSettingsMock, setLocaleMock } = vi.hoisted(() => ({
  getPublicCatalogMock: vi.fn(),
  getPublicSettingsMock: vi.fn(),
  setLocaleMock: vi.fn(),
}))

vi.mock('@/getoneapi/catalog/api', () => ({
  getPublicCatalog: getPublicCatalogMock,
}))

vi.mock('@/api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/auth')>()
  return { ...actual, getPublicSettings: getPublicSettingsMock }
})

vi.mock('@/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/i18n')>()
  return { ...actual, setLocale: setLocaleMock }
})

const settings: PublicSettings = {
  registration_enabled: true,
  email_verify_enabled: false,
  force_email_on_third_party_signup: false,
  registration_email_suffix_whitelist: [],
  promo_code_enabled: false,
  password_reset_enabled: true,
  invitation_code_enabled: false,
  login_agreement_enabled: false,
  login_agreement_documents: [
    { id: 'terms', title: 'Terms of service', content_md: 'Terms' },
  ],
  turnstile_enabled: false,
  turnstile_site_key: '',
  site_name: 'GetOneAPI',
  site_logo: '/logo.png',
  site_subtitle: 'One API access layer',
  api_base_url: 'https://api.example.test',
  contact_info: 'support@example.test',
  doc_url: 'https://docs.example.test/guide?lang=en',
  home_content: '',
  hide_ccs_import_button: false,
  payment_enabled: false,
  risk_control_enabled: false,
  table_default_page_size: 20,
  table_page_size_options: [20],
  custom_menu_items: [],
  custom_endpoints: [],
  linuxdo_oauth_enabled: false,
  dingtalk_oauth_enabled: false,
  wechat_oauth_enabled: false,
  oidc_oauth_enabled: false,
  oidc_oauth_provider_name: 'OIDC',
  github_oauth_enabled: false,
  google_oauth_enabled: false,
  backend_mode_enabled: false,
  version: 'test',
  balance_low_notify_enabled: false,
  account_quota_notify_enabled: false,
  balance_low_notify_threshold: 0,
  channel_monitor_enabled: false,
  channel_monitor_default_interval_seconds: 60,
  available_channels_enabled: false,
  service_quota_enabled: false,
  affiliate_enabled: false,
  getoneapi_user_ui_enabled: true,
  getoneapi_public_catalog_enabled: true,
}

const catalogFixture: PublicCatalog = {
  version: '2026.07.18',
  updated_at: '2026-07-18T08:30:00Z',
  currency: 'USD',
  token_price_unit: 'per_1m_tokens',
  timezone: 'Asia/Shanghai',
  groups: [
    {
      key: 'general',
      name: 'General access',
      description: 'Reviewed models for standard API clients.',
      platform: 'anthropic',
      rate_multiplier: 1.25,
      peak_rate_enabled: true,
      peak_start: '09:00',
      peak_end: '18:00',
      peak_rate_multiplier: 1.5,
      supported_clients: ['claude_code', 'openai_sdk'],
      models: [
        {
          name: 'model-alpha',
          platform: 'anthropic',
          pricing: {
            billing_mode: 'token',
            input_per_million: 2,
            output_per_million: 8,
            cache_write_per_million: 2.5,
            cache_read_per_million: 0.2,
            image_output_per_million: null,
            per_request: null,
            intervals: [],
          },
        },
        {
          name: 'model-tiered',
          platform: 'anthropic',
          pricing: {
            billing_mode: 'token',
            input_per_million: null,
            output_per_million: null,
            cache_write_per_million: null,
            cache_read_per_million: null,
            image_output_per_million: null,
            per_request: null,
            intervals: [
              {
                min_tokens: 0,
                max_tokens: 100000,
                input_per_million: 4.8,
                output_per_million: 12,
                cache_write_per_million: null,
                cache_read_per_million: null,
                per_request: null,
              },
            ],
          },
        },
      ],
    },
    {
      key: 'secondary',
      name: 'Secondary',
      description: 'A second reviewed group.',
      platform: 'openai',
      rate_multiplier: 1,
      peak_rate_enabled: false,
      peak_start: '',
      peak_end: '',
      peak_rate_multiplier: 1,
      supported_clients: ['openai_sdk'],
      models: [],
    },
  ],
}

function configureStore(catalogEnabled = true) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const appStore = useAppStore(pinia)
  appStore.cachedPublicSettings = {
    ...settings,
    getoneapi_public_catalog_enabled: catalogEnabled,
  }
  appStore.siteName = settings.site_name
  appStore.siteLogo = settings.site_logo
  appStore.docUrl = settings.doc_url
  appStore.contactInfo = settings.contact_info
  return { appStore, pinia }
}

async function mountCatalog(catalogEnabled = true): Promise<VueWrapper> {
  const { pinia } = configureStore(catalogEnabled)
  const wrapper = mount(CatalogPreview, { global: { plugins: [pinia] } })
  await flushPromises()
  return wrapper
}

describe('GetOneAPI high-fidelity component baseline', () => {
  beforeEach(() => {
    document.body.replaceChildren()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    getPublicCatalogMock.mockReset()
    getPublicSettingsMock.mockReset().mockResolvedValue(settings)
    setLocaleMock.mockReset().mockResolvedValue(undefined)
    i18n.global.setLocaleMessage('en', {
      auth: {
        welcomeBack: () => 'Welcome back',
        signInToAccount: () => 'Sign in to continue',
        emailLabel: () => 'Email',
        emailPlaceholder: () => 'Enter your email',
        passwordLabel: () => 'Password',
        passwordPlaceholder: () => 'Enter your password',
        signIn: () => 'Sign in',
        dontHaveAccount: () => "Don't have an account?",
        forgotPassword: () => 'Forgot password?',
        signUp: () => 'Sign up',
      },
    })
  })

  it('renders the real login form as a recoverable, non-decorative auth surface', async () => {
    const { pinia } = configureStore(false)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', component: LoginView },
        { path: '/home', component: { template: '<div />' } },
        { path: '/forgot-password', component: { template: '<div />' } },
        { path: '/register', component: { template: '<div />' } },
        { path: '/dashboard', component: { template: '<div />' } },
      ],
    })
    await router.push('/login')
    await router.isReady()

    const loginSurface = mount(LoginView, {
      global: { plugins: [pinia, router, i18n] },
    })
    await flushPromises()

    expect(loginSurface.get('form').attributes('aria-busy')).toBe('false')
    expect(loginSurface.get('[data-ui="auth-primary"]').classes()).not.toContain('rounded-full')
    expect(loginSurface.find('[data-ui="decorative-orb"]').exists()).toBe(false)
    expect(loginSurface.get('button[type="button"]').attributes('aria-label')).not.toBe('')
  })

  it('renders a visible brand image with stable dimensions and useful alt text', () => {
    const brand = mount(BrandLockup, {
      props: { siteName: 'GetOneAPI', logoUrl: '/logo.png' },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })

    expect(brand.get('img').attributes('width')).toBe('40')
    expect(brand.get('img').attributes('height')).toBe('40')
    expect(brand.get('img').attributes('alt')).toContain('GetOneAPI')
    expect(brand.text()).toContain('GetOneAPI')
  })

  it('supports arrow-key selection in the theme segmented control', async () => {
    const theme = mount(ThemeModeControl, { attachTo: document.body })
    const light = theme.get('[data-theme-mode="light"]')

    await light.trigger('click')
    expect(light.attributes('tabindex')).toBe('0')
    expect(theme.get('[data-theme-mode="dark"]').attributes('tabindex')).toBe('-1')
    ;(light.element as HTMLButtonElement).focus()
    await light.trigger('keydown', { key: 'ArrowRight' })

    expect(theme.get('[data-theme-mode="dark"]').attributes('aria-checked')).toBe('true')
    expect(document.activeElement).toBe(theme.get('[data-theme-mode="dark"]').element)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('supports vertical arrow-key selection in the theme segmented control', async () => {
    const theme = mount(ThemeModeControl, { attachTo: document.body })
    const light = theme.get('[data-theme-mode="light"]')

    await light.trigger('click')
    ;(light.element as HTMLButtonElement).focus()
    await light.trigger('keydown', { key: 'ArrowDown' })

    const dark = theme.get('[data-theme-mode="dark"]')
    expect(dark.attributes('aria-checked')).toBe('true')
    expect(document.activeElement).toBe(dark.element)

    await dark.trigger('keydown', { key: 'ArrowUp' })
    expect(light.attributes('aria-checked')).toBe('true')
    expect(document.activeElement).toBe(light.element)
  })

  it('uses language names and shared icons without flag emoji', async () => {
    const language = mount(LanguageMenu, {
      attachTo: document.body,
      global: { plugins: [i18n] },
    })
    const trigger = language.get('[data-ui="language-trigger"]')

    expect(trigger.attributes('aria-label')).not.toBe('')
    await trigger.trigger('click')
    expect(language.text()).toContain('English')
    expect(language.text()).toContain('中文')
    expect(language.text()).not.toMatch(/[\u{1F1E6}-\u{1F1FF}]/u)

    await flushPromises()
    expect(document.activeElement).toBe(language.get('[data-locale="en"]').element)
    await language.get('[data-locale="en"]').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(language.get('[data-locale="zh"]').element)
    await language.get('[data-locale="zh"]').trigger('keydown', { key: 'Escape' })
    expect(document.activeElement).toBe(trigger.element)

    await trigger.trigger('click')

    await language.get('[data-locale="zh"]').trigger('click')
    expect(setLocaleMock).toHaveBeenCalledWith('zh')
  })

  it('closes the language menu when focus moves outside it', async () => {
    const outsideButton = document.createElement('button')
    document.body.appendChild(outsideButton)
    const language = mount(LanguageMenu, {
      attachTo: document.body,
      global: { plugins: [i18n] },
    })
    const trigger = language.get('[data-ui="language-trigger"]')

    await trigger.trigger('click')
    await flushPromises()
    expect(language.find('[role="menu"]').exists()).toBe(true)

    outsideButton.focus()
    await flushPromises()

    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(language.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(outsideButton)
  })

  it('renders live USD pricing metadata and toggles disclosure from the keyboard', async () => {
    getPublicCatalogMock.mockResolvedValue(catalogFixture)
    const catalog = await mountCatalog()
    document.body.appendChild(catalog.element)

    expect(catalog.get('[data-ui="catalog-currency"]').text()).toContain('USD')
    expect(catalog.findAll('[data-ui="catalog-price"]')[0].text()).toContain('/ 1M')
    expect(catalog.findAll('[data-ui="catalog-price"]')[0].text()).toContain('$2.00 / 1M')
    expect(catalog.get('[data-ui="catalog-tier"]').text()).toContain('0-100,000 tokens')
    expect(catalog.get('[data-ui="catalog-tier"]').text()).toContain('$4.80 / 1M')
    expect(catalog.get('[data-ui="catalog-updated-at"]').text()).not.toBe('')
    expect(catalog.text()).not.toContain('channel')
    expect(catalog.text()).not.toContain('account count')

    const disclosure = catalog.get('[data-ui="catalog-disclosure"]')
    expect(disclosure.attributes('aria-expanded')).toBe('false')
    await disclosure.trigger('keydown', { key: 'Enter' })
    expect(disclosure.attributes('aria-expanded')).toBe('true')
    await disclosure.trigger('keydown', { key: ' ' })
    expect(disclosure.attributes('aria-expanded')).toBe('false')

    const activeTab = catalog.get('[role="tab"][aria-selected="true"]')
    ;(activeTab.element as HTMLButtonElement).focus()
    await activeTab.trigger('keydown', { key: 'ArrowRight' })
    expect(catalog.get('[role="tab"][aria-selected="true"]').text()).toBe('Secondary')
    expect(document.activeElement).toBe(catalog.get('[role="tab"][aria-selected="true"]').element)
  })

  it('keeps non-login auth routes compact and catalog-free', async () => {
    const { pinia } = configureStore(true)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/register', component: { template: '<div />' } }],
    })
    await router.push('/register')
    await router.isReady()
    getPublicCatalogMock.mockClear()

    const layout = mount(GetOneAPIAuthLayout, {
      slots: { default: '<form><label for="name">Name</label><input id="name" /></form>' },
      global: { plugins: [pinia, router] },
    })
    await flushPromises()

    expect(layout.find('.g1-auth-facts').exists()).toBe(false)
    expect(layout.find('.g1-auth-catalog').exists()).toBe(false)
    expect(layout.get('form')).toBeTruthy()
    expect(getPublicCatalogMock).not.toHaveBeenCalled()
  })

  it('adds only language and theme controls around user content', () => {
    const { pinia } = configureStore(true)
    const layout = mount(GetOneAPIUserLayout, {
      slots: { default: '<div data-testid="user-content" />' },
      global: { plugins: [pinia] },
    })

    expect(layout.find('header').exists()).toBe(false)
    expect(layout.find('[data-ui="language-trigger"]').exists()).toBe(true)
    expect(layout.find('[role="radiogroup"]').exists()).toBe(true)
    expect(layout.find('[data-testid="user-content"]').exists()).toBe(true)
  })

  it('keeps disabled, loading, empty, and error pricing states explicit and retryable', async () => {
    const disabled = await mountCatalog(false)
    expect(disabled.get('[data-catalog-state="disabled"]').text()).toContain('Billing rules')

    let resolveCatalog: ((catalog: PublicCatalog) => void) | undefined
    getPublicCatalogMock.mockImplementation(
      () => new Promise<PublicCatalog>((resolve) => { resolveCatalog = resolve })
    )
    const { pinia } = configureStore(true)
    const loading = mount(CatalogPreview, { global: { plugins: [pinia] } })
    expect(loading.get('[data-catalog-state="loading"]')).toBeTruthy()
    resolveCatalog?.({ ...catalogFixture, groups: [] })
    await flushPromises()
    expect(loading.get('[data-catalog-state="empty"]').text()).toContain('No public pricing')

    getPublicCatalogMock.mockRejectedValueOnce(new Error('offline'))
    const error = await mountCatalog()
    expect(error.get('[data-catalog-state="error"]').text()).toContain('temporarily unavailable')
    getPublicCatalogMock.mockResolvedValueOnce(catalogFixture)
    await error.get('[data-ui="catalog-retry"]').trigger('click')
    await flushPromises()
    expect(error.get('[data-catalog-state="ready"]')).toBeTruthy()
  })

  it('derives documentation anchors, legal routes, and safe support presentation from settings', () => {
    const links = getPublicLinks(settings)

    expect(links.documentation.map((link) => link.href)).toEqual([
      'https://docs.example.test/guide?lang=en#quick-start',
      'https://docs.example.test/guide?lang=en#billing',
      'https://docs.example.test/guide?lang=en#refunds',
    ])
    expect(links.legal).toEqual([
      { label: 'Terms of service', href: '/legal/terms' },
    ])
    expect(links.support).toEqual({ label: 'support@example.test', href: '' })
  })

  it('reports operational only for an explicit healthy response', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ status: 'ok' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ status: 'degraded' }) })
      .mockRejectedValueOnce(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPublicHealth()).resolves.toBe('operational')
    await expect(getPublicHealth()).resolves.toBe('unknown')
    await expect(getPublicHealth()).resolves.toBe('unknown')
    expect(fetchMock).toHaveBeenCalledWith('/health', { cache: 'no-store', signal: undefined })
  })

  it('keeps the dark primary foreground contrast-safe without changing the blue token', () => {
    const surfacesCss = readFileSync(resolve(process.cwd(), 'src/getoneapi/theme/surfaces.css'), 'utf8')
    const ruleStart = surfacesCss.indexOf(".dark [data-surface^='getoneapi-'] button[data-variant='primary']")
    const darkPrimaryRule = surfacesCss.slice(ruleStart, surfacesCss.indexOf('}', ruleStart) + 1)

    expect(ruleStart).toBeGreaterThan(-1)
    expect(darkPrimaryRule).toContain('color: #001b33')
    expect(darkPrimaryRule).not.toContain('color: #ffffff')
  })
})
