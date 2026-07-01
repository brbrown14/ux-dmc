import { test, expect } from '@playwright/test'
import { MapsPage } from '../../pages/MapsPage'
import { NPCPage } from '../../pages/NPCPage'

test.describe('AddLocationNpc', () => {
  test('create a location on maps page then assign it to an npc', async ({ page }) => {
    const maps = new MapsPage(page)
    await maps.goto()
    await expect(maps.heading).toBeVisible()

    await maps.uploadMap('Tucson', 'A barren Wasteland')

    // Wait for upload to complete — modal closes, success toast appears
    await expect(maps.heading).toBeVisible()

    const npc = new NPCPage(page)
    await npc.goto()
    await expect(npc.heading).toBeVisible()

    await npc.nameInput.fill('Joe Dude')
    await npc.locationSelect.selectOption('Tucson')
    await npc.occupationInput.fill('tavern owner')
    await npc.historyInput.fill('always been a dude')
    await npc.personalityInput.fill('chill af')
    await npc.createButton.click()

    await expect(page.getByText('Joe Dude').first()).toBeVisible()
  })
})
