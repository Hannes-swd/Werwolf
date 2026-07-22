import { defineConfig, devices } from '@playwright/test'

const LOCAL_BASE_URL = 'http://127.0.0.1:3101'
const configuredBaseURL = process.env.PLAYWRIGHT_BASE_URL?.trim()
const baseURL = configuredBaseURL || LOCAL_BASE_URL
const useLocalRealtime = process.env.E2E_LOCAL_REALTIME === '1'

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    headless: true,
    locale: 'en-US',
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: configuredBaseURL
    ? undefined
    : {
        command: useLocalRealtime
          ? 'npm run build && node scripts/realtime-test-server.mjs'
          : 'npm run dev -- --hostname 127.0.0.1 --port 3101',
        url: LOCAL_BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
