import { test, expect } from '@playwright/test'
import { EncounterBuilderPage } from '../../pages/EncounterBuilderPage'

test.describe('enteringPartyLevels', () => {
  test('set party members to level 20 and verify difficulty updates', async ({ page }) => {
    const encounter = new EncounterBuilderPage(page)
    await encounter.goto()
    await expect(encounter.heading).toBeVisible()

    await encounter.partySizeInput.focus()
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowUp')
    }
    await expect(encounter.levelInputs).toHaveCount(10)

    // First 5: type "20" directly
    for (let i = 0; i < 5; i++) {
      const before = await encounter.getDifficultySignature()
      await encounter.levelInputs.nth(i).fill('20')
      await expect(encounter.levelInputs.nth(i)).toHaveValue('20')
      const after = await encounter.getDifficultySignature()
      expect(after).not.toBe(before)
    }

    // Last 5: press ArrowUp until level reaches 20
    for (let i = 5; i < 10; i++) {
      const before = await encounter.getDifficultySignature()
      const input = encounter.levelInputs.nth(i)
      await input.focus()
      for (let p = 0; p < 19; p++) {
        await page.keyboard.press('ArrowUp')
      }
      await expect(input).toHaveValue('20')
      const after = await encounter.getDifficultySignature()
      expect(after).not.toBe(before)
    }
  })

  test('level input clamps to 1-20 range', async ({ page }) => {
    const encounter = new EncounterBuilderPage(page)
    await encounter.goto()
    await expect(encounter.heading).toBeVisible()

    const input = encounter.levelInputs.nth(0)

    await input.fill('25')
    await expect(input).toHaveValue('20')

    await input.fill('0')
    await expect(input).toHaveValue('1')

    await input.fill('-5')
    await expect(input).toHaveValue('1')
  })
})
