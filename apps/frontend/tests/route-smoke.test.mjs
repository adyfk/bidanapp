import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');
const port = 3201;
const baseUrl = `http://127.0.0.1:${port}`;

const catalogJsonPath = resolve(frontendDir, 'src/data/simulation/catalog.json');
const catalog = JSON.parse(await readFile(catalogJsonPath, 'utf8'));
const professionalSlug = catalog.professionals[0]?.slug;
const serviceSlug = catalog.services[0]?.slug;

let nextProcess;
let processOutput = '';

const appendOutput = (chunk) => {
  processOutput += chunk.toString();
};

const wait = (timeMs) => new Promise((resolveWait) => setTimeout(resolveWait, timeMs));

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
    nextProcess = spawn(process.execPath, [nextBin, 'dev', '--hostname', '127.0.0.1', '--port', String(port)], {
      cwd: frontendDir,
      env: {
        ...process.env,
        CI: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    nextProcess.stdout.on('data', appendOutput);
    nextProcess.stderr.on('data', appendOutput);

    await waitForServer();
  },
  { timeout: 180000 },
);

after(async () => {
  if (!nextProcess || nextProcess.exitCode !== null) {
    return;
  }

  nextProcess.kill('SIGTERM');
  await wait(1000);

  if (nextProcess.exitCode === null) {
    nextProcess.kill('SIGKILL');
  }
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
      '/appointments',
      '/profile',
      '/examples/backend',
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
