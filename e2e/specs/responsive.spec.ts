import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/DashboardPage'

test.describe('Responsive layout', () => {
  test('nav shows hamburger menu on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    const hamburger = page.getByRole('button', { name: /open menu/i })
    await expect(hamburger).toBeVisible()
  })

  test('dashboard grid is single column on narrow screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    const cards = page.getByRole('button').filter({ has: page.locator('h3') })
    await expect(cards).toHaveCount(4)
  })
})
