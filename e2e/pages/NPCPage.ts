import type { Page, Locator } from '@playwright/test'

export class NPCPage {
  readonly page: Page
  readonly heading: Locator
  readonly nameInput: Locator
  readonly createButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /NPC Manager/i })
    this.nameInput = page.locator('#npc-name')
    this.createButton = page.getByRole('button', { name: 'Create NPC' })
  }

  async goto() {
    await this.page.goto('/npcs')
  }
}
