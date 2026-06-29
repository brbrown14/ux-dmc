import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['html'], ['json', { outputFile: 'results.json' }]]
    : 'html',
  use: {
    baseURL: 'http://localhost:46119',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testDir: './e2e',
      testMatch: 'auth.setup.ts',
      use: { storageState: undefined },
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/user.json' },
    },
    {
      name: 'firefox',
      dependencies: ['setup'],
      use: { ...devices['Desktop Firefox'], storageState: 'e2e/.auth/user.json' },
    },
    {
      name: 'webkit',
      dependencies: ['setup'],
      use: { ...devices['Desktop Safari'], storageState: 'e2e/.auth/user.json' },
    },
  ],
})
