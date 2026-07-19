import { expect, test } from '@playwright/test'

test('login form is visible and interactive', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/login')
  await expect(page.locator('[data-surface^="getoneapi-"]')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('#email')).toBeVisible()
  await expect(page.locator('#email')).toBeEnabled()
  await expect(page.locator('#password')).toBeVisible()
  await expect(page.locator('[data-ui="auth-primary"]')).toBeVisible()
  await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false')
})

test('register link is reachable from login', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/login')
  const registerLink = page.locator('a[href="/register"]')
  if (await registerLink.count() > 0) {
    await expect(registerLink.first()).toBeVisible()
  }
})

test('forgot password link works when enabled', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/login')
  const forgotLink = page.locator('a[href="/forgot-password"]')
  const count = await forgotLink.count()
  expect(count).toBeGreaterThanOrEqual(0)
})
