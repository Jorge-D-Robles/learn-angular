import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: 'e2e/test-output/',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npx ng serve --configuration production',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
