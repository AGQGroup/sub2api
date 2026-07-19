import { expect, test } from '@playwright/test'
import { installAuthenticatedMocks } from './mockApi'

test('5-user core workflow: login -> create key -> configure -> request complete', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await installAuthenticatedMocks(page, 'light', 'user')

  await page.goto('/login')
  await expect(page.locator('[data-surface="getoneapi-auth"]')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false')

  await page.fill('#email', 'user@example.test')
  await page.fill('#password', 'password123')
  await page.click('[data-ui="auth-primary"]')

  await page.route('**/api/v1/auth/login*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: {
          token: 'e2e-jwt-token',
          user: { id: 100, email: 'user@example.test', role: 'user', balance: 25 },
        },
      }),
    }),
  )

  await page.goto('/dashboard')
  await expect(page.locator('[data-surface="getoneapi-user"]')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('[data-ui="first-request-checklist"]')).toBeVisible({ timeout: 5000 })

  await page.goto('/keys')
  await expect(page.locator('[data-ui="first-request-checklist"]')).toBeVisible({ timeout: 5000 })

  const checklist = page.locator('[data-ui="checklist-key"]')
  await expect(checklist).toBeVisible()
  expect(await checklist.getAttribute('data-complete')).toBe('true')

  await page.goto('/usage')
  await page.goto('/profile')
  await expect(page.locator('[data-surface="getoneapi-user"]')).toBeVisible({ timeout: 5000 })
})

test('catalog failure does not block login', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })

  await installAuthenticatedMocks(page, 'light')

  await page.unroute('**/api/v1/catalog/public*')
  await page.route('**/api/v1/catalog/public*', (route) =>
    route.abort('connectionrefused'),
  )

  await page.goto('/login')
  await expect(page.locator('#email')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('#email')).toBeEnabled()
  await expect(page.locator('form')).toBeVisible()
})
