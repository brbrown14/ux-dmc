import { test as setup, expect } from '@playwright/test'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')

  await page.fill('input[id="username"]', 'user')
  await page.fill('input[id="password"]', 'password')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/', { timeout: 10000 })
  await page.context().storageState({ path: 'e2e/.auth/user.json' })
})
