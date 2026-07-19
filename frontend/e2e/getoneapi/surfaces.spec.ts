import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { installDeterministicMocks, publicSettings } from './mockApi'

const viewports = [
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
] as const

async function assertSurfaceInvariants(page: Page, surface: string): Promise<void> {
  const root = page.locator(`[data-surface="${surface}"]`)
  await expect(root).toBeVisible()

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth)

  const undersizedTargets = await page
    .locator(
      [
        'a[href]',
        'button',
        'input:not([type="hidden"])',
        'select',
        'textarea',
        '[role="button"]',
        '[role="tab"]',
        '[role="radio"]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(','),
    )
    .evaluateAll((elements) =>
      elements.flatMap((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        if (rect.width === 0 || rect.height === 0 || style.visibility === 'hidden') return []
        if (rect.width >= 44 && rect.height >= 44) return []
        return [{ element: element.tagName, width: rect.width, height: rect.height }]
      }),
    )
  expect.soft(undersizedTargets).toEqual([])
}

const publicRoutes = ['/home', '/login'] as const

for (const viewport of viewports) {
  for (const mode of ['light', 'dark'] as const) {
    for (const route of publicRoutes) {
      test(`${route} ${viewport.name} ${mode}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' })
        await installDeterministicMocks(page, mode)
        await page.goto(route)

        if (route === '/login') {
          await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false')
          await expect(page.locator('[data-catalog-state="ready"]')).toBeVisible({ timeout: 5000 })
        }

        await page.screenshot({
          fullPage: true,
          animations: 'disabled',
        })
      })
    }
  }
}

for (const viewport of viewports) {
  for (const mode of ['light', 'dark'] as const) {
    test(`dashboard ${viewport.name} ${mode} surface invariants`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' })

      await page.addInitScript(
        ({ settings, theme }) => {
          (window as any).__APP_CONFIG__ = settings
          localStorage.setItem('theme', theme)
          localStorage.setItem('sub2api_locale', 'en')
          localStorage.setItem('auth_token', 'e2e-token')
          localStorage.setItem(
            'auth_user',
            JSON.stringify({ id: 100, email: 'user@example.test', role: 'user', balance: 25 }),
          )
        },
        { settings: publicSettings, theme: mode },
      )

      await page.route('**/setup/status*', (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 0, data: { needs_setup: false } }),
        }),
      )
      await page.route('**/api/v1/settings/public*', (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 0, data: publicSettings }),
        }),
      )
      await page.route('**/api/v1/auth/me*', (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 0,
            data: { id: 100, email: 'user@example.test', role: 'user', balance: 25 },
          }),
        }),
      )
      await page.route('**/usage/dashboard/stats*', (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total_api_keys: 1,
            active_api_keys: 1,
            total_requests: 5,
            today_requests: 2,
          }),
        }),
      )
      await page.route('**/usage/dashboard/trend*', (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ trend: [] }),
        }),
      )
      await page.route('**/usage/dashboard/models*', (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ models: [] }),
        }),
      )

      await page.goto('/dashboard')
      await expect(page.locator('[data-surface="getoneapi-user"]')).toBeVisible({ timeout: 5000 })
      await assertSurfaceInvariants(page, 'getoneapi-user')
    })
  }
}
