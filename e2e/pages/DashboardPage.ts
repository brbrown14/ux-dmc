import type { Page, Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly npcCard: Locator
  readonly encounterCard: Locator
  readonly mapsCard: Locator
  readonly storyCard: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Dungeon Master's Companion/i })
    this.npcCard = page.getByRole('button', { name: /NPC Tool/i })
    this.encounterCard = page.getByRole('button', { name: /Encounter Builder/i })
    this.mapsCard = page.getByRole('button', { name: /World Map/i })
    this.storyCard = page.getByRole('button', { name: /Game Story Line/i })
  }

  async goto() {
    await this.page.goto('/')
  }
}
