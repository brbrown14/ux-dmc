import { test as setup, expect } from '@playwright/test'

setup('authenticate', async ({ page }) => {
  await page.goto('/')
  await page.waitForURL('/login')

  await page.fill('input[id="username"]', 'user')
  await page.fill('input[id="password"]', 'password')
  await page.click('button[type="submit"]')

  // Wait for a nav link that only appears on the authenticated dashboard
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 })
  await page.context().storageState({ path: 'e2e/.auth/user.json' })
})