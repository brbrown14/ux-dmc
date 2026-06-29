import type { Page, Locator } from '@playwright/test'

export class NPCPage {
  readonly page: Page
  readonly heading: Locator
  readonly nameInput: Locator
  readonly locationSelect: Locator
  readonly occupationInput: Locator
  readonly historyInput: Locator
  readonly personalityInput: Locator
  readonly createButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /NPC Manager/i })
    this.nameInput = page.locator('#npc-name')
    this.locationSelect = page.locator('#npc-location')
    this.occupationInput = page.locator('#npc-occupation')
    this.historyInput = page.locator('#npc-history')
    this.personalityInput = page.locator('#npc-personality')
    this.createButton = page.getByRole('button', { name: 'Create NPC' })
  }

  async goto() {
    await this.page.goto('/npcs')
  }
}
