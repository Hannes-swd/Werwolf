import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'https://werwolf-mu.vercel.app',
    headless: true,
    viewport: { width: 390, height: 844 },
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  reporter: [['list']],
  workers: 1,
})
