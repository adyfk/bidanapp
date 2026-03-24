import { defineConfig } from '@playwright/test';

const frontendPort = 3301;
const backendPort = 3302;
const baseUrl = `http://127.0.0.1:${frontendPort}`;
const backendApiBaseUrl = `http://127.0.0.1:${backendPort}/api/v1`;
const backendMode = process.env.PLAYWRIGHT_BACKEND_MODE ?? 'lightweight';
const backendCommand =
  backendMode === 'seeded' ? 'node ../../scripts/qa/start-playwright-backend.mjs' : 'go run ./cmd/dev-api';
const backendCwd = backendMode === 'seeded' ? '.' : '../backend';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 180000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: baseUrl,
    headless: true,
    trace: 'on-first-retry',
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
