import { test, expect } from '@playwright/test'
import { EncounterBuilderPage } from '../../pages/EncounterBuilderPage'

async function assertSearchFilters(page: EncounterBuilderPage, query: string) {
  await page.searchInput.fill(query)
  const names = await page.getMonsterNames()
  for (const name of names) {
    expect(name.toLowerCase()).toContain(query)
  }
}

test.describe('encounterBuilderSearchBar', () => {
  test('searching by "yeti" filters monster list', async ({ page }) => {
    const encounter = new EncounterBuilderPage(page)
    await encounter.goto()
    await expect(encounter.heading).toBeVisible()
    await assertSearchFilters(encounter, 'yeti')
  })

  test('searching by "dragon" filters monster list', async ({ page }) => {
    const encounter = new EncounterBuilderPage(page)
    await encounter.goto()
    await expect(encounter.heading).toBeVisible()
    await assertSearchFilters(encounter, 'dragon')
  })

  test('filtering by type "monstrosity" shows only monstrosities', async ({ page }) => {
    const encounter = new EncounterBuilderPage(page)
    await encounter.goto()
    await expect(encounter.heading).toBeVisible()

    await encounter.typeFilter.selectOption('monstrosity')

    const types = await encounter.getMonsterTypes()
    for (const type of types) {
      expect(type.toLowerCase()).toBe('monstrosity')
    }
  })

  for (const cr of ['Unknown', '1/8', '5', '20', '30']) {
    test(`filtering by CR "${cr}" shows only CR ${cr} monsters`, async ({ page }) => {
      const encounter = new EncounterBuilderPage(page)
      await encounter.goto()
      await expect(encounter.heading).toBeVisible()

      await encounter.crFilter.selectOption(cr)

      const crs = await encounter.getMonsterCRs()
      for (const displayed of crs) {
        expect(displayed).toBe(cr)
      }
    })
  }
})
