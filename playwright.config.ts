import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: [['list']],
  outputDir: 'test/scratch/playwright-results',
  use: {
    baseURL: 'http://127.0.0.1:4175/preview/',
    viewport: { width: 1440, height: 1000 },
    browserName: 'chromium',
    headless: true,
  },
  webServer: { command: 'node scripts/preview.mjs', url: 'http://127.0.0.1:4175/preview/', reuseExistingServer: false },
});
