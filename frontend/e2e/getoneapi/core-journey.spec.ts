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

test('login primary button is reachable and properly sized', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/login')
  const primary = page.locator('[data-ui="auth-primary"]')
  await expect(primary).toBeVisible()
  const box = await primary.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThanOrEqual(44)
  expect(box!.height).toBeGreaterThanOrEqual(44)
})

test('login page loads without errors', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/login')
  await expect(page.locator('form')).toBeVisible()
  const bodyText = await page.locator('body').innerText()
  expect(bodyText.length).toBeGreaterThan(0)
})
