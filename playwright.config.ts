import { defineConfig, devices } from '@playwright/test';

const PRESS_ARGS = process.env.PRESS_ARGS ?? ''
const TIMEOUT_MS = 15000
const RETRIES_CI = 2
const RETRIES_LOCAL = 0
const WORKERS_CI = 1

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: 'list',
  retries: process.env.CI ? RETRIES_CI : RETRIES_LOCAL,
  testDir: './src',
  testMatch: '**/*.e2e.ts',
  timeout: TIMEOUT_MS,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: `bun run src/cli/index.ts preview ${PRESS_ARGS}`.trim(),
    reuseExistingServer: !process.env.CI,
    stderr: 'pipe',
    stdout: 'pipe',
    timeout: 180000,
    url: 'http://localhost:5173',
  },
  workers: process.env.CI ? WORKERS_CI : undefined,
})
