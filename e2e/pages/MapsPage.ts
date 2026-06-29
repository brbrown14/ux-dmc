import type { Page, Locator } from '@playwright/test'

export class MapsPage {
  readonly page: Page
  readonly heading: Locator
  readonly uploadButton: Locator
  readonly titleInput: Locator
  readonly descInput: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /World Maps/i })
    this.uploadButton = page.getByRole('button', { name: /Upload Map/i })
    this.titleInput = page.getByPlaceholder('Map title')
    this.descInput = page.getByPlaceholder('Describe this map...')
    this.submitButton = page.getByRole('dialog', { name: 'Upload Map' }).getByRole('button', { name: 'Upload' })
  }

  async goto() {
    await this.page.goto('/maps')
  }

  async uploadMap(title: string, description: string) {
    await this.uploadButton.click()
    await this.titleInput.fill(title)
    await this.descInput.fill(description)
    await this.submitButton.click()
    // Wait for the success toast to appear then dismiss, confirming the upload is done
    await this.page.getByText('Map uploaded successfully!').waitFor({ state: 'visible', timeout: 10000 })
  }
}
