import { test, expect, type Page } from '@playwright/test'
import { EncounterBuilderPage } from '../../pages/EncounterBuilderPage'

async function populateEncounter(page: Page) {
  const encounter = new EncounterBuilderPage(page)
  await encounter.goto()
  await expect(encounter.heading).toBeVisible()

  await encounter.partySizeInput.focus()
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('ArrowUp')
  }
  await expect(encounter.levelInputs).toHaveCount(6)

  for (let i = 0; i < 6; i++) {
    await encounter.levelInputs.nth(i).fill('11')
    await expect(encounter.levelInputs.nth(i)).toHaveValue('11')
  }

  await encounter.searchInput.fill('AboLEth')
  const monsterRow = page.locator('[class*="monsterRow"]')
  await expect(monsterRow.filter({ hasText: 'Aboleth' }).first()).toBeVisible()

  await monsterRow.filter({ hasText: 'Aboleth' }).locator('[class*="addBtn"]').first().click()
  await expect(page.locator('[class*="diffBadge"]')).toHaveText('Easy')

  await monsterRow.filter({ hasText: 'Aboleth Spawn' }).locator('[class*="addBtn"]').first().click()
  const encounterRow = page.locator('[class*="encounterRow"]')
  await encounterRow.filter({ hasText: 'Aboleth Spawn' }).locator('[class*="qtyControls"] button:last-child').click()
  await expect(page.locator('[class*="diffBadge"]')).toHaveText('Medium')

  await encounter.searchInput.fill('')

  await encounter.typeFilter.selectOption('fiend')
  await expect(page.locator('[class*="monsterRow"]').first()).toBeVisible()

  const balorRow = monsterRow.filter({ hasText: 'Balor' })
  await expect(balorRow.first()).toBeVisible()
  await balorRow.locator('[class*="addBtn"]').first().click()
  await expect(page.locator('[class*="diffBadge"]')).toHaveText('Deadly')

  return { encounter, monsterRow, encounterRow }
}

test.describe('fullEncounterFlow', () => {
  test('creates, saves, clears, and loads an encounter with difficulty progression', async ({ page }) => {
    const { encounter, encounterRow } = await populateEncounter(page)

    // Name and save the encounter
    await page.getByPlaceholder('Encounter name...').fill('Aboleth Fight')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Aboleth Fight')).toBeVisible()

    // Remove all creatures from the current encounter
    while (await page.locator('[class*="removeBtn"]').count() > 0) {
      await page.locator('[class*="removeBtn"]').first().click()
    }
    await expect(page.getByText(/No monsters in encounter/)).toBeVisible()

    // Load the saved encounter
    await page.locator('[class*="savedRow"]').filter({ hasText: 'Aboleth Fight' }).getByRole('button', { name: 'Load' }).click()
    await expect(page.locator('[class*="monsterName"]').filter({ hasText: /^Aboleth$/ })).toBeVisible()
    await expect(page.locator('[class*="monsterName"]').filter({ hasText: 'Aboleth Spawn' })).toBeVisible()
    await expect(encounterRow.filter({ hasText: 'Balor' })).toBeVisible()
    await expect(page.getByPlaceholder('Encounter name...')).toHaveValue('Aboleth Fight')

    // Delete the saved encounter and confirm in popup
    page.once('dialog', dialog => dialog.accept())
    await page.locator('[class*="savedRow"]').filter({ hasText: 'Aboleth Fight' }).getByRole('button', { name: 'Del' }).click()
    await expect(page.getByText('Aboleth Fight')).not.toBeVisible()
  })

  test('shows error when saving without an encounter name', async ({ page }) => {
    const { encounter } = await populateEncounter(page)

    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('alert')).toContainText('Please enter an encounter name.')
  })
})
