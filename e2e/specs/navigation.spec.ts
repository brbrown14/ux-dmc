import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/DashboardPage'
import { NPCPage } from '../pages/NPCPage'

test.describe('Navigation', () => {
  test('dashboard shows all tool cards', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    await expect(dashboard.heading).toBeVisible()
    await expect(dashboard.npcCard).toBeVisible()
    await expect(dashboard.encounterCard).toBeVisible()
    await expect(dashboard.mapsCard).toBeVisible()
    await expect(dashboard.storyCard).toBeVisible()
  })

  test('can navigate to NPC page via card', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.npcCard.click()

    const npcPage = new NPCPage(page)
    await expect(npcPage.heading).toBeVisible()
  })

  test('top nav links are visible on dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'NPCs' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Encounters' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Maps' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Story' })).toBeVisible()
  })

  test('theme toggle is present in nav', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    const toggle = page.getByRole('button', { name: /switch to/i })
    await expect(toggle).toBeVisible()
  })
})
