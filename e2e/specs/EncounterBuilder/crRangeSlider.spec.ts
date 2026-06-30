import { test, expect } from '@playwright/test'
import { EncounterBuilderPage } from '../../pages/EncounterBuilderPage'

function crToNum(cr: string): number {
  if (cr === '1/8') return 0.125
  if (cr === '1/4') return 0.25
  if (cr === '1/2') return 0.5
  return parseInt(cr) || 0
}

async function assertMonstersInRange(encounter: EncounterBuilderPage, min: number, max: number) {
  const crs = await encounter.getMonsterCRs()
  for (const cr of crs) {
    const val = crToNum(cr)
    expect(val).toBeGreaterThanOrEqual(min)
    expect(val).toBeLessThanOrEqual(max)
  }
}

test.describe('crRangeSlider', () => {
  const ranges: [number, number][] = [
    [5, 12],
    [2, 7],
    [1, 30],
    [10, 15],
  ]

  for (const [min, max] of ranges) {
    test(`sliding range to ${min}–${max} filters monsters correctly`, async ({ page }) => {
      const encounter = new EncounterBuilderPage(page)
      await encounter.goto()
      await expect(encounter.heading).toBeVisible()

      await encounter.setCrRangeMin(min)
      await encounter.setCrRangeMax(max)
      await assertMonstersInRange(encounter, min, max)
    })
  }

  test('max handle cannot be dragged below min handle', async ({ page }) => {
    const encounter = new EncounterBuilderPage(page)
    await encounter.goto()
    await expect(encounter.heading).toBeVisible()

    await encounter.setCrRangeMin(8)
    await encounter.setCrRangeMax(13)
    await assertMonstersInRange(encounter, 8, 13)

    await encounter.setCrRangeMax(5)
    const [minVal, maxVal] = await encounter.getCrRangeValues()
    expect(maxVal).toBeGreaterThanOrEqual(minVal)
    expect(maxVal).toBe(8)
  })
})
