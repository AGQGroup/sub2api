import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const viewports = [
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
] as const

async function assertSurfaceInvariants(page: Page, surface: string): Promise<void> {
  const root = page.locator(`[data-surface="${surface}"]`)
  await expect(root).toBeVisible({ timeout: 10000 })

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth)

  const undersizedTargets = await page
    .locator(
      [
        'a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea',
        '[role="button"]', '[role="tab"]', '[role="radio"]', '[tabindex]:not([tabindex="-1"])',
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

for (const viewport of viewports) {
  for (const mode of ['light', 'dark'] as const) {
    test(`/home ${viewport.name} ${mode}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' })
      await page.goto('/home')
      await expect(page.locator('[data-surface^="getoneapi-"]')).toBeVisible({ timeout: 10000 })
    })

    test(`/login ${viewport.name} ${mode}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' })
      await page.goto('/login')
      await expect(page.locator('[data-surface^="getoneapi-"]')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('form')).toBeVisible()
    })
  }
}

test('public home renders getoneapi surface', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/home')
  await page.waitForLoadState('networkidle')
  const count = await page.locator('[data-surface^="getoneapi-"]').count()
  expect(count).toBeGreaterThan(0)
})

test('public home renders without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/home')
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth)
})
