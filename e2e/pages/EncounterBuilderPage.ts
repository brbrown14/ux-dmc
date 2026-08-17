import type { Page, Locator } from '@playwright/test'

export class EncounterBuilderPage {
  readonly page: Page
  readonly heading: Locator
  readonly partySizeInput: Locator
  readonly levelInputs: Locator
  readonly searchInput: Locator
  readonly typeFilter: Locator
  readonly crFilter: Locator
  readonly monsterRows: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Encounter Builder/i })
    this.partySizeInput = page.locator('label:has-text("Party Size:") + input[type="number"]')
    this.levelInputs = page.locator('[title^="Player"]')
    this.searchInput = page.getByPlaceholder('Search by name...')
    this.typeFilter = page.locator('select').first()
    this.crFilter = page.locator('select').nth(1)
    this.monsterRows = page.locator('[class*="monsterRow"]')
  }

  async goto() {
    await this.page.goto('/encounters')
  }

  async getDifficultySignature(): Promise<string> {
    const el = this.page.locator('[class*="diffSegment"]')
    return (await el.textContent()) ?? ''
  }

  async getMonsterNames(): Promise<string[]> {
    return await this.page.evaluate(() =>
      Array.from(document.querySelectorAll('[class*="monsterRow"]')).map(row => {
        const span = row.querySelector('span:nth-child(1)')
        return span?.textContent?.trim() ?? ''
      }).filter(Boolean)
    )
  }

  async getMonsterTypes(): Promise<string[]> {
    return await this.page.evaluate(() =>
      Array.from(document.querySelectorAll('[class*="monsterRow"]')).map(row => {
        const span = row.querySelector('span:nth-child(2)')
        return span?.textContent?.trim() ?? ''
      }).filter(Boolean)
    )
  }

  async getMonsterCRs(): Promise<string[]> {
    return await this.page.evaluate(() =>
      Array.from(document.querySelectorAll('[class*="monsterRow"]')).map(row => {
        const span = row.querySelector('span:nth-child(3)')
        return span?.textContent?.trim() ?? ''
      }).filter(Boolean)
    )
  }

  async setCrRangeMin(value: number) {
    await this.page.locator('input[type="range"]').first().evaluate((el, val) => {
      const input = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      setter?.call(input, String(val))
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }, value)
  }

  async setCrRangeMax(value: number) {
    await this.page.locator('input[type="range"]').nth(1).evaluate((el, val) => {
      const input = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      setter?.call(input, String(val))
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }, value)
  }

  async getCrRangeValues(): Promise<[number, number]> {
    const values = await this.page.locator('input[type="range"]').evaluateAll((els) =>
      els.map((el) => parseFloat((el as HTMLInputElement).value))
    )
    return [values[0], values[1]]
  }
}
