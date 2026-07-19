import { expect, test } from '@playwright/test'

test('admin dashboard is free of getoneapi surface attributes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/admin')
  const count = await page.locator('[data-surface^="getoneapi-"]').count()
  expect(count).toBe(0)
})

test('/setup is excluded from getoneapi surfaces', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/setup')
  const count = await page.locator('[data-surface^="getoneapi-"]').count()
  expect(count).toBe(0)
})

test('/home renders getoneapi surface for public visitors', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/home')
  await expect(page.locator('[data-surface^="getoneapi-"]')).toBeVisible({ timeout: 10000 })
})
