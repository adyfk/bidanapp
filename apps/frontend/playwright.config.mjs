import os from 'node:os';
import { defineConfig } from '@playwright/test';

const frontendPort = 3301;
const backendPort = 3302;
const baseUrl = `http://127.0.0.1:${frontendPort}`;
const backendApiBaseUrl = `http://127.0.0.1:${backendPort}/api/v1`;
const backendMode = process.env.PLAYWRIGHT_BACKEND_MODE ?? 'lightweight';
const traceMode = process.env.PLAYWRIGHT_TRACE_MODE ?? 'on-first-retry';
const screenshotMode = process.env.PLAYWRIGHT_SCREENSHOT_MODE ?? 'only-on-failure';
const videoMode = process.env.PLAYWRIGHT_VIDEO_MODE ?? 'off';
const evidenceEnabled = /^(1|true|yes)$/i.test(process.env.PLAYWRIGHT_EVIDENCE ?? '');
const evidenceResultsDir = process.env.PLAYWRIGHT_EVIDENCE_RESULTS_DIR ?? './allure-results';
const backendCommand =
  backendMode === 'seeded' ? 'node ../../scripts/qa/start-playwright-backend.mjs' : 'go run ./cmd/dev-api';
const backendCwd = backendMode === 'seeded' ? '.' : '../backend';
const reporters = [['list']];

if (evidenceEnabled) {
  reporters.push([
    'allure-playwright',
    {
      detail: true,
      environmentInfo: {
        backendMode,
        node: process.version,
        os: `${os.platform()} ${os.release()}`,
        traceMode,
      },
      resultsDir: evidenceResultsDir,
      suiteTitle: false,
    },
  ]);
}

export default defineConfig({
  outputDir: './test-results',
  testDir: './tests/e2e',
  timeout: 180000,
  fullyParallel: false,
  reporter: reporters,
  use: {
    baseURL: baseUrl,
    headless: true,
    screenshot: screenshotMode,
    trace: traceMode,
    video: videoMode,
  },
  webServer: [
    {
      command: backendCommand,
      cwd: backendCwd,
      env: {
        ...process.env,
        APP_ENV: 'test',
        CORS_ALLOWED_ORIGINS: baseUrl,
        HTTP_HOST: '127.0.0.1',
        HTTP_PORT: String(backendPort),
        PLAYWRIGHT_FRONTEND_ORIGIN: baseUrl,
      },
      reuseExistingServer: false,
      timeout: 180000,
      url: `${backendApiBaseUrl}/bootstrap`,
    },
    {
      command: 'node ../../scripts/qa/start-playwright-frontend.mjs',
      cwd: '.',
      env: {
        ...process.env,
        CI: '1',
        PLAYWRIGHT_FRONTEND_PORT: String(frontendPort),
        PLAYWRIGHT_BACKEND_API_BASE_URL: backendApiBaseUrl,
        NEXT_PUBLIC_API_BASE_URL: backendApiBaseUrl,
      },
      reuseExistingServer: false,
      timeout: 180000,
      url: `${baseUrl}/en/home`,
    },
  ],
});
