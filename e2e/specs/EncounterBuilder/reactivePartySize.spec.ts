import { test, expect } from '@playwright/test'
import { EncounterBuilderPage } from '../../pages/EncounterBuilderPage'

test.describe('reactivePartySize', () => {
  test('level input count matches party size', async ({ page }) => {
    const encounter = new EncounterBuilderPage(page)
    await encounter.goto()
    await expect(encounter.heading).toBeVisible()

    await expect(encounter.partySizeInput).toHaveValue('4')
    await expect(encounter.levelInputs).toHaveCount(4)

    await encounter.partySizeInput.focus()
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowDown')
    }
    await expect(encounter.levelInputs).toHaveCount(1)

    await encounter.partySizeInput.fill('8')
    await expect(encounter.levelInputs).toHaveCount(8)

    await encounter.partySizeInput.fill('1000')
    await expect(encounter.levelInputs).toHaveCount(1000)
  })
})
