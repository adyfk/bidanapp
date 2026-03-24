import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(__dirname, '..');
const backendDir = resolve(frontendDir, '..', 'backend');
const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');
const frontendPort = 3201;
const backendPort = 3202;
const baseUrl = `http://127.0.0.1:${frontendPort}`;
const backendApiBaseUrl = `http://127.0.0.1:${backendPort}/api/v1`;
const nextDevLockPath = resolve(frontendDir, '.next', 'dev', 'lock');

const professionalsJsonPath = resolve(backendDir, 'seeddata/professionals.json');
const servicesJsonPath = resolve(backendDir, 'seeddata/services.json');
const appointmentsJsonPath = resolve(backendDir, 'seeddata/appointments.json');
const professionals = JSON.parse(await readFile(professionalsJsonPath, 'utf8'));
const services = JSON.parse(await readFile(servicesJsonPath, 'utf8'));
const appointments = JSON.parse(await readFile(appointmentsJsonPath, 'utf8'));
const professionalSlug = professionals[0]?.slug;
const serviceSlug = services[0]?.slug;
const appointmentId = appointments[0]?.id;

let nextProcess;
let backendProcess;
let processOutput = '';

const appendOutput = (chunk) => {
  processOutput += chunk.toString();
};

const wait = (timeMs) => new Promise((resolveWait) => setTimeout(resolveWait, timeMs));
const clearStaleNextDevLock = async () => {
  await rm(nextDevLockPath, { force: true });
};

const cleanupProcess = (childProcess) => {
  childProcess?.stdout?.removeAllListeners();
  childProcess?.stderr?.removeAllListeners();
  childProcess?.stdout?.destroy();
  childProcess?.stderr?.destroy();
  childProcess?.removeAllListeners();
};

const waitForExit = (childProcess) =>
  new Promise((resolveExit) => {
    if (!childProcess || childProcess.exitCode !== null) {
      resolveExit();
      return;
    }

    childProcess.once('exit', () => resolveExit());
  });

const stopProcess = async (childProcess) => {
  if (!childProcess || childProcess.exitCode !== null) {
    return;
  }

  childProcess.kill('SIGTERM');
  await Promise.race([waitForExit(childProcess), wait(1000)]);

  if (childProcess.exitCode === null) {
    childProcess.kill('SIGKILL');
    await Promise.race([waitForExit(childProcess), wait(1000)]);
  }

  cleanupProcess(childProcess);
};

const waitForBackend = async () => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (backendProcess?.exitCode !== null) {
      throw new Error(`Backend dev server exited early.\n${processOutput}`);
    }

    try {
      const response = await fetch(`${backendApiBaseUrl}/bootstrap`, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 400) {
        return;
      }
    } catch {}

    await wait(1000);
  }

  throw new Error(`Timed out waiting for backend dev server.\n${processOutput}`);
};

const waitForServer = async () => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (nextProcess?.exitCode !== null) {
      throw new Error(`Next dev server exited early.\n${processOutput}`);
    }

    try {
      const response = await fetch(`${baseUrl}/id`, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 400) {
        return;
      }
    } catch {}

    await wait(1000);
  }

  throw new Error(`Timed out waiting for Next dev server.\n${processOutput}`);
};

before(
  async () => {
    try {
      await clearStaleNextDevLock();

      backendProcess = spawn('go', ['run', './cmd/dev-api'], {
        cwd: backendDir,
        env: {
          ...process.env,
          APP_ENV: 'test',
          CORS_ALLOWED_ORIGINS: baseUrl,
          HTTP_HOST: '127.0.0.1',
          HTTP_PORT: String(backendPort),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      backendProcess.stdout.on('data', appendOutput);
      backendProcess.stderr.on('data', appendOutput);

      await waitForBackend();

      nextProcess = spawn(
        process.execPath,
        [nextBin, 'dev', '--hostname', '127.0.0.1', '--port', String(frontendPort)],
        {
          cwd: frontendDir,
          env: {
            ...process.env,
            CI: '1',
            NEXT_PUBLIC_API_BASE_URL: backendApiBaseUrl,
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      nextProcess.stdout.on('data', appendOutput);
      nextProcess.stderr.on('data', appendOutput);

      await waitForServer();
    } catch (error) {
      await stopProcess(nextProcess);
      await stopProcess(backendProcess);
      throw error;
    }
  },
  { timeout: 180000 },
);

after(async () => {
  if (!nextProcess || nextProcess.exitCode !== null) {
    if (!backendProcess || backendProcess.exitCode !== null) {
      return;
    }
  }

  await stopProcess(nextProcess);
  await stopProcess(backendProcess);
});

test(
  'root redirects through locale middleware',
  async () => {
    const response = await fetch(`${baseUrl}/`, { redirect: 'manual' });

    assert.equal(response.status, 307);
    assert.equal(response.headers.get('location'), '/id');
  },
  { timeout: 60000 },
);

test(
  'localized routes render for id and en',
  async () => {
    const locales = ['id', 'en'];
    const routes = [
      '',
      '/home',
      '/services',
      '/explore',
      '/auth/customer',
      '/appointments',
      `/appointments/${appointmentId}`,
      `/activity/${appointmentId}`,
      '/notifications',
      '/profile',
      '/for-professionals',
      '/for-professionals/setup',
      '/for-professionals/profile',
      '/for-professionals/dashboard',
      '/for-professionals/dashboard/overview',
      '/for-professionals/dashboard/requests',
      '/for-professionals/dashboard/services',
      '/for-professionals/dashboard/availability',
      '/for-professionals/dashboard/coverage',
      '/for-professionals/dashboard/portfolio',
      '/for-professionals/dashboard/notifications',
      '/for-professionals/dashboard/trust',
      `/p/${professionalSlug}`,
      `/s/${serviceSlug}`,
    ];

    for (const locale of locales) {
      for (const route of routes) {
        const response = await fetch(`${baseUrl}/${locale}${route}`);
        const html = await response.text();

        assert.equal(response.status, 200, `Expected 200 for /${locale}${route}`);
        assert.match(
          html,
          new RegExp(`lang="${locale}"`),
          `Expected locale lang="${locale}" in HTML for /${locale}${route}`,
        );
      }
    }
  },
  { timeout: 180000 },
);

test(
  'invalid localized slugs return 404',
  async () => {
    const invalidRoutes = [
      '/id/p/not-a-real-professional',
      '/en/p/not-a-real-professional',
      '/id/s/not-a-real-service',
      '/en/s/not-a-real-service',
    ];

    for (const route of invalidRoutes) {
      const response = await fetch(`${baseUrl}${route}`);
      assert.equal(response.status, 404, `Expected 404 for ${route}`);
    }
  },
  { timeout: 120000 },
);

test(
  'admin routes render outside locale middleware',
  async () => {
    const loginResponse = await fetch(`${baseUrl}/admin/login`, { redirect: 'manual' });
    const loginHtml = await loginResponse.text();

    assert.equal(loginResponse.status, 200);
    assert.match(loginHtml, /BidanApp Ops Console/);
    assert.match(loginHtml, /lang="id"/);

    const routes = [
      '/admin',
      '/admin/overview',
      '/admin/customers',
      '/admin/professionals',
      '/admin/services',
      '/admin/appointments',
      '/admin/support',
      '/admin/studio',
    ];

    for (const route of routes) {
      const response = await fetch(`${baseUrl}${route}`, { redirect: 'manual' });
      const html = await response.text();

      assert.equal(response.status, 200, `Expected 200 for ${route}`);
      assert.match(html, /lang="id"/, `Expected default html lang for ${route}`);
    }
  },
  { timeout: 120000 },
);
