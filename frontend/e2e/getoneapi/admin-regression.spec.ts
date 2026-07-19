import { expect, test } from '@playwright/test'
import { installAuthenticatedMocks, publicSettings } from './mockApi'

test('admin dashboard pixel identity with flag enabled vs disabled', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })

  const flagOffSettings = { ...publicSettings, getoneapi_user_ui_enabled: false }
  await installAuthenticatedMocks(page, 'light', 'admin')
  await page.unroute('**/api/v1/settings/public*')
  await page.route('**/api/v1/settings/public*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, data: flagOffSettings }),
    }),
  )

  await page.goto('/admin/dashboard')
  await expect(page.locator('[data-surface^="getoneapi-"]')).toHaveCount(0)

  const screenshotWithoutFlag = await page.screenshot({ fullPage: true, animations: 'disabled' })

  const flagOnSettings = { ...publicSettings, getoneapi_user_ui_enabled: true }
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await installAuthenticatedMocks(page, 'light', 'admin')
  await page.unroute('**/api/v1/settings/public*')
  await page.route('**/api/v1/settings/public*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, data: flagOnSettings }),
    }),
  )

  await page.goto('/admin/dashboard')
  await expect(page.locator('[data-surface^="getoneapi-"]')).toHaveCount(0)

  const screenshotWithFlag = await page.screenshot({ fullPage: true, animations: 'disabled' })

  expect(screenshotWithFlag).toEqual(screenshotWithoutFlag)
})

test('flag true selects getoneapi surface for regular user', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })

  await installAuthenticatedMocks(page, 'light', 'user')
  await page.goto('/dashboard')
  await expect(page.locator('[data-surface="getoneapi-user"]')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('[data-ui="first-request-checklist"]')).toBeVisible({ timeout: 5000 })
})

test('flag false selects legacy surface for regular user', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })

  const flagOffSettings = { ...publicSettings, getoneapi_user_ui_enabled: false }
  await installAuthenticatedMocks(page, 'light', 'user')
  await page.unroute('**/api/v1/settings/public*')
  await page.route('**/api/v1/settings/public*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, data: flagOffSettings }),
    }),
  )

  await page.goto('/dashboard')
  await expect(page.locator('[data-surface^="getoneapi-"]')).toHaveCount(0)
})
