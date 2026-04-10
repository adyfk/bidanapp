import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const journeyMode = process.env.JOURNEY_MODE === '1';
const outputDir =
  process.env.PLAYWRIGHT_OUTPUT_DIR ??
  (journeyMode ? path.join('artifacts', 'journeys', 'latest', 'playwright') : 'test-results');
const htmlReportDir =
  process.env.PLAYWRIGHT_HTML_REPORT ??
  (journeyMode ? path.join('artifacts', 'playwright-report', 'latest') : 'playwright-report');

const reporter = journeyMode
  ? [['list'], ['html', { open: 'never', outputFolder: htmlReportDir }]]
  : process.env.CI
    ? [['html', { open: 'never' }], ['list']]
    : 'list';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  outputDir,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter,
  use: {
    baseURL: 'http://bidan.lvh.me:3002',
    screenshot: 'only-on-failure',
    trace: journeyMode ? 'on' : 'retain-on-failure',
    video: journeyMode ? 'on' : 'off',
  },
  webServer: {
    command: 'npm run dev:setup && npm run dev:e2e',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    url: 'http://bidan.lvh.me:3002/id',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
