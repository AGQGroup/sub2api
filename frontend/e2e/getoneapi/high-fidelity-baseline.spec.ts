import { expect, test, type Page } from '@playwright/test'

const publicSettings = {
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
    { id: 'privacy', title: 'Privacy notice', content_md: 'Privacy' },
  ],
  turnstile_enabled: false,
  turnstile_site_key: '',
  site_name: 'GetOneAPI',
  site_logo: '/logo.png',
  site_subtitle: 'A clear access layer for reviewed AI model endpoints.',
  api_base_url: 'https://api.getone.example/v1',
  contact_info: 'support@getone.example',
  doc_url: 'https://docs.getone.example/guide',
  home_content: '',
  hide_ccs_import_button: false,
  payment_enabled: false,
  risk_control_enabled: false,
  table_default_page_size: 20,
  table_page_size_options: [20, 50],
  custom_menu_items: [],
  custom_endpoints: [],
  linuxdo_oauth_enabled: false,
  dingtalk_oauth_enabled: false,
  wechat_oauth_enabled: false,
  wechat_oauth_open_enabled: false,
  wechat_oauth_mp_enabled: false,
  wechat_oauth_mobile_enabled: false,
  oidc_oauth_enabled: false,
  oidc_oauth_provider_name: 'OIDC',
  github_oauth_enabled: false,
  google_oauth_enabled: false,
  backend_mode_enabled: false,
  version: 'baseline',
  server_timezone: 'Asia/Shanghai',
  server_utc_offset: '+08:00',
  balance_low_notify_enabled: false,
  account_quota_notify_enabled: false,
  balance_low_notify_threshold: 0,
  channel_monitor_enabled: false,
  channel_monitor_default_interval_seconds: 60,
  available_channels_enabled: false,
  service_quota_enabled: false,
  affiliate_enabled: false,
  allow_user_view_error_requests: false,
  getoneapi_user_ui_enabled: true,
  getoneapi_public_catalog_enabled: true,
}

const publicCatalog = {
  version: '2026.07.18',
  updated_at: '2026-07-18T08:30:00+08:00',
  currency: 'USD',
  token_price_unit: 'per_1m_tokens',
  timezone: 'Asia/Shanghai',
  groups: [
    {
      key: 'general',
      name: 'General',
      description: 'Reviewed models for standard API clients.',
      platform: 'anthropic',
      rate_multiplier: 1.1,
      peak_rate_enabled: true,
      peak_start: '09:00',
      peak_end: '18:00',
      peak_rate_multiplier: 1.25,
      supported_clients: ['Claude Code', 'OpenAI SDK'],
      models: [
        {
          name: 'claude-sonnet-4-5',
          platform: 'anthropic',
          pricing: {
            billing_mode: 'token',
            input_per_million: 3,
            output_per_million: 15,
            cache_write_per_million: 3.75,
            cache_read_per_million: 0.3,
            image_output_per_million: null,
            per_request: null,
            intervals: [],
          },
        },
        {
          name: 'claude-haiku-4-5',
          platform: 'anthropic',
          pricing: {
            billing_mode: 'token',
            input_per_million: 1,
            output_per_million: 5,
            cache_write_per_million: 1.25,
            cache_read_per_million: 0.1,
            image_output_per_million: null,
            per_request: null,
            intervals: [],
          },
        },
        {
          name: 'claude-opus-4-1',
          platform: 'anthropic',
          pricing: {
            billing_mode: 'token',
            input_per_million: 15,
            output_per_million: 75,
            cache_write_per_million: 18.75,
            cache_read_per_million: 1.5,
            image_output_per_million: null,
            per_request: null,
            intervals: [],
          },
        },
      ],
    },
    {
      key: 'openai',
      name: 'OpenAI compatible',
      description: 'Reviewed chat-completions compatible endpoints.',
      platform: 'openai',
      rate_multiplier: 1,
      peak_rate_enabled: false,
      peak_start: '',
      peak_end: '',
      peak_rate_multiplier: 1,
      supported_clients: ['OpenAI SDK'],
      models: [],
    },
  ],
}

const viewports = [
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
] as const

async function installDeterministicMocks(page: Page, mode: 'light' | 'dark'): Promise<void> {
  await page.addInitScript(({ settings, theme }) => {
    window.__APP_CONFIG__ = settings
    localStorage.setItem('theme', theme)
    localStorage.setItem('sub2api_locale', 'en')
  }, { settings: publicSettings, theme: mode })

  await page.route('**/setup/status*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 0, data: { needs_setup: false, step: 'complete' } }),
  }))
  await page.route('**/api/v1/settings/public*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 0, data: publicSettings }),
  }))
  await page.route('**/api/v1/catalog/public*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 0, data: publicCatalog }),
  }))
  await page.route('**/health', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ok' }),
  }))
}

function channelToLinear(value: number): number {
  const channel = value / 255
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

function contrastRatio(foreground: string, background: string): number {
  const parse = (value: string) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
  const luminance = (value: string) => {
    const [red, green, blue] = parse(value).map(channelToLinear)
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue
  }
  const foregroundLuminance = luminance(foreground)
  const backgroundLuminance = luminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

for (const viewport of viewports) {
  for (const mode of ['light', 'dark'] as const) {
    test(`${viewport.name} ${mode} login baseline`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' })
      await installDeterministicMocks(page, mode)
      await page.goto('/login')

      await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false')
      await expect(page.locator('[data-catalog-state="ready"]')).toBeVisible()
      await expect(page.locator('header img')).toHaveJSProperty('complete', true)
      expect(await page.locator('header img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
      expect(await page.locator('[data-variant="primary"]').count()).toBe(1)

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyFontSize: Number.parseFloat(getComputedStyle(document.body).fontSize),
      }))
      expect(dimensions.scrollWidth).toBe(dimensions.clientWidth)
      expect(dimensions.bodyFontSize).toBeGreaterThanOrEqual(16)

      const serviceLinkColors = await page.locator('.g1-auth-facts a').first().evaluate((link) => ({
        foreground: getComputedStyle(link).color,
        background: getComputedStyle(document.querySelector('[data-surface="getoneapi-auth"]')!).backgroundColor,
      }))
      expect(contrastRatio(serviceLinkColors.foreground, serviceLinkColors.background)).toBeGreaterThanOrEqual(4.5)

      const inputPaddings = await page.locator('#email, #password').evaluateAll((inputs) =>
        inputs.map((input) => ({
          left: Number.parseFloat(getComputedStyle(input).paddingLeft),
          right: Number.parseFloat(getComputedStyle(input).paddingRight),
        }))
      )
      expect(inputPaddings.every((padding) => padding.left >= 44)).toBe(true)
      expect(inputPaddings[1].right).toBeGreaterThanOrEqual(44)

      for (const selector of [
        '[data-ui="auth-primary"]',
        '[data-ui="auth-password-toggle"]',
        '[data-ui="language-trigger"]',
        '[data-theme-mode="light"]',
      ]) {
        const box = await page.locator(selector).boundingBox()
        expect(box?.width).toBeGreaterThanOrEqual(44)
        expect(box?.height).toBeGreaterThanOrEqual(44)
      }

      if (mode === 'dark') {
        const colors = await page.locator('[data-ui="auth-primary"]').evaluate((button) => ({
          foreground: getComputedStyle(button).color,
          background: getComputedStyle(button).backgroundColor,
        }))
        expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5)
      }

      const primary = page.locator('[data-ui="auth-primary"]')
      await primary.hover()
      await primary.evaluate((button) => {
        button.getAnimations().forEach((animation) => animation.finish())
      })
      const hoverColors = await primary.evaluate((button) => ({
        foreground: getComputedStyle(button).color,
        background: getComputedStyle(button).backgroundColor,
      }))
      expect(contrastRatio(hoverColors.foreground, hoverColors.background)).toBeGreaterThanOrEqual(4.5)
      await page.mouse.move(1, 1)

      if (viewport.width < 768) {
        const formBox = await page.locator('form').boundingBox()
        const catalogBox = await page.locator('.g1-auth-catalog').boundingBox()
        expect(formBox?.y).toBeLessThan(catalogBox?.y || 0)
      }

      const pixels = await page.screenshot({ fullPage: true, animations: 'disabled' })
      expect(pixels.byteLength).toBeGreaterThan(10_000)
      await expect(page).toHaveScreenshot(`login-${viewport.name}-${mode}.png`, {
        fullPage: true,
        animations: 'disabled',
      })
    })
  }
}
