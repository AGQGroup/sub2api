import { expect, test, type Locator, type Page } from '@playwright/test'

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

async function getEffectiveColors(locator: Locator): Promise<{ foreground: string; background: string }> {
  return locator.evaluate((element) => {
    const parseColor = (value: string): [number, number, number, number] => {
      if (value === 'transparent') return [0, 0, 0, 0]
      const channels = (value.match(/[\d.]+/g) || []).map(Number)
      return [channels[0] || 0, channels[1] || 0, channels[2] || 0, channels[3] ?? 1]
    }
    const composite = (
      foreground: [number, number, number, number],
      background: [number, number, number, number]
    ): [number, number, number, number] => {
      const alpha = foreground[3] + background[3] * (1 - foreground[3])
      if (alpha === 0) return [0, 0, 0, 0]
      return [
        (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
        alpha,
      ]
    }

    let background: [number, number, number, number] = [0, 0, 0, 0]
    let current: Element | null = element
    while (current) {
      background = composite(background, parseColor(getComputedStyle(current).backgroundColor))
      if (background[3] >= 0.999) break
      current = current.parentElement
    }

    return {
      foreground: getComputedStyle(element).color,
      background: `rgb(${background.slice(0, 3).map((channel) => Math.round(channel)).join(', ')})`,
    }
  })
}

async function requireBox(locator: Locator): Promise<NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>> {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return box!
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

      const inputPaddings = await page.locator('#email, #password').evaluateAll((inputs) =>
        inputs.map((input) => ({
          left: Number.parseFloat(getComputedStyle(input).paddingLeft),
          right: Number.parseFloat(getComputedStyle(input).paddingRight),
        }))
      )
      expect(inputPaddings.every((padding) => padding.left >= 44)).toBe(true)
      expect(inputPaddings[1].right).toBeGreaterThanOrEqual(44)

      const undersizedTargets = await page.locator([
        'a[href]',
        'button',
        'input:not([type="hidden"])',
        'select',
        'textarea',
        '[role="button"]',
        '[role="tab"]',
        '[role="radio"]',
        '[role="menuitemradio"]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
        'summary',
      ].join(',')).evaluateAll((elements) => elements.flatMap((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        if (rect.width === 0 || rect.height === 0 || style.visibility === 'hidden') return []
        if (rect.width >= 44 && rect.height >= 44) return []
        return [{
          target: element.getAttribute('data-ui')
            || element.getAttribute('aria-label')
            || element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60)
            || element.tagName.toLowerCase(),
          width: rect.width,
          height: rect.height,
        }]
      }))
      expect.soft(undersizedTargets, 'visible interactive targets smaller than 44x44').toEqual([])

      const textLinks = page.locator('a[href]:visible')
      for (let index = 0; index < await textLinks.count(); index += 1) {
        const link = textLinks.nth(index)
        const label = (await link.innerText()).trim().replace(/\s+/g, ' ')
        if (!label) continue
        const idleColors = await getEffectiveColors(link)
        expect.soft(
          contrastRatio(idleColors.foreground, idleColors.background),
          `${label} idle contrast`
        ).toBeGreaterThanOrEqual(4.5)
        await link.hover()
        await link.evaluate((element) => element.getAnimations().forEach((animation) => animation.finish()))
        const hoverColors = await getEffectiveColors(link)
        expect.soft(
          contrastRatio(hoverColors.foreground, hoverColors.background),
          `${label} hover contrast`
        ).toBeGreaterThanOrEqual(4.5)
      }
      await page.mouse.move(1, 1)

      const visualViolations = await page.locator('body *').evaluateAll((elements) => elements.flatMap((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        if (rect.width === 0 || rect.height === 0 || style.visibility === 'hidden') return []
        const radiusToPixels = (value: string) => value.endsWith('%')
          ? Math.min(rect.width, rect.height) * Number.parseFloat(value) / 100
          : Number.parseFloat(value)
        const maxRadius = Math.max(...[
          style.borderTopLeftRadius,
          style.borderTopRightRadius,
          style.borderBottomRightRadius,
          style.borderBottomLeftRadius,
        ].map(radiusToPixels))
        const reasons = [
          ...(maxRadius > 8.01 ? [`radius ${maxRadius}px`] : []),
          ...(style.backgroundImage.includes('gradient') ? [style.backgroundImage] : []),
        ]
        if (!reasons.length) return []
        return [{
          element: `${element.tagName.toLowerCase()}.${element.className || ''}`.slice(0, 100),
          reasons,
        }]
      }))
      expect.soft(visualViolations, 'visible radius or gradient violations').toEqual([])
      await expect.soft(page.locator('.card .card:visible')).toHaveCount(0)
      await expect.soft(page.locator('[data-ui="decorative-orb"]')).toHaveCount(0)

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

      const headerBox = await requireBox(page.locator('header'))
      const mainBox = await requireBox(page.locator('main'))
      const factsBox = await requireBox(page.locator('.g1-auth-facts'))
      const authBox = await requireBox(page.locator('.g1-auth-panel'))
      const catalogBox = await requireBox(page.locator('.g1-auth-catalog'))
      expect.soft(headerBox.y + headerBox.height, 'header must end before main').toBeLessThanOrEqual(mainBox.y + 0.5)

      if (viewport.width >= 768) {
        expect.soft(factsBox.x + factsBox.width, 'facts must stay left of authentication').toBeLessThanOrEqual(authBox.x)
        expect.soft(catalogBox.x + catalogBox.width, 'catalog must stay left of authentication').toBeLessThanOrEqual(authBox.x)
        expect.soft(factsBox.y + factsBox.height, 'facts must end before catalog').toBeLessThanOrEqual(catalogBox.y)
      } else {
        expect.soft(factsBox.y + factsBox.height, 'mobile facts must end before authentication').toBeLessThanOrEqual(authBox.y)
        expect.soft(authBox.y + authBox.height, 'mobile authentication must end before catalog').toBeLessThanOrEqual(catalogBox.y)
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
