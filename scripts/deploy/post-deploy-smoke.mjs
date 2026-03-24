#!/usr/bin/env node

import process from 'node:process';
import { parseEnvFile, resolveEnvFile } from './lib/env-file.mjs';

const DEFAULT_TIMEOUT_MS = 90_000;
const DEFAULT_INTERVAL_MS = 2_000;

main().catch((error) => {
  process.stderr.write(`post-deploy smoke failed: ${error.message}\n`);
  process.exit(1);
});

async function main() {
  const envFileArg = process.argv[2];
  if (!envFileArg) {
    process.stderr.write('usage: node ./scripts/deploy/post-deploy-smoke.mjs <env-file>\n');
    process.exit(1);
  }

  const envFile = resolveEnvFile(envFileArg);
  const env = parseEnvFile(envFile);
  const backendBaseUrl =
    process.env.SMOKE_API_BASE_URL ?? env.SMOKE_API_BASE_URL ?? `http://127.0.0.1:${env.BACKEND_PORT ?? '8080'}/api/v1`;
  const frontendBaseUrl =
    process.env.SMOKE_SITE_URL ?? env.SMOKE_SITE_URL ?? `http://127.0.0.1:${env.FRONTEND_PORT ?? '3000'}`;

  process.stdout.write(`post-deploy smoke using ${envFile}\n`);
  process.stdout.write(`- frontend: ${frontendBaseUrl}\n`);
  process.stdout.write(`- backend: ${backendBaseUrl}\n`);

  await waitForReadiness(frontendBaseUrl, backendBaseUrl);

  const completedChecks = [];
  const record = (label) => {
    completedChecks.push(label);
    process.stdout.write(`✓ ${label}\n`);
  };

  const health = await requestJSON('backend health', apiUrl(backendBaseUrl, '/health'));
  assert(health?.data?.service, 'backend health payload missing service');
  if ((env.APP_ENV ?? '') !== '' && health?.data?.environment && health.data.environment !== env.APP_ENV) {
    throw new Error(`backend health environment mismatch: expected ${env.APP_ENV}, got ${health.data.environment}`);
  }
  record('backend health');

  const bootstrap = await requestJSON('bootstrap', apiUrl(backendBaseUrl, '/bootstrap'));
  assert(Array.isArray(bootstrap?.data?.catalog?.services), 'bootstrap payload missing catalog services');
  record('bootstrap payload');

  const professionals = await requestJSON('professionals', apiUrl(backendBaseUrl, '/professionals'));
  assert(Array.isArray(professionals?.data) && professionals.data.length > 0, 'professionals list is empty');
  record('professionals list');

  const sampleProfessionalSlug = professionals.data[0]?.slug;
  assert(sampleProfessionalSlug, 'sample professional slug missing');
  await requestJSON('professional detail', apiUrl(backendBaseUrl, `/professionals/${sampleProfessionalSlug}`));
  record('professional detail');

  const appointments = await requestJSON('appointments', apiUrl(backendBaseUrl, '/appointments'));
  assert(Array.isArray(appointments?.data?.appointments), 'appointments payload missing list');
  record('appointments read model');

  const viewerSession = await requestJSON('viewer session', apiUrl(backendBaseUrl, '/viewer/session'));
  assert(viewerSession?.data?.mode, 'viewer session payload missing mode');
  record('viewer session read');

  const adminUnauthorized = await requestJSON('admin unauthorized', apiUrl(backendBaseUrl, '/admin/console'), {
    expectedStatus: 401,
  });
  assert(adminUnauthorized?.error?.code, 'admin unauthorized payload missing error');
  record('admin auth guard');

  await requestText('frontend root', frontendBaseUrl);
  record('frontend root');

  await requestText('frontend locale root', new URL('/id', `${frontendBaseUrl}/`).toString());
  record('frontend locale root');

  await requestText('frontend robots', new URL('/robots.txt', `${frontendBaseUrl}/`).toString());
  record('frontend robots');

  await requestText('frontend sitemap', new URL('/sitemap.xml', `${frontendBaseUrl}/`).toString());
  record('frontend sitemap');

  process.stdout.write(`post-deploy smoke passed with ${completedChecks.length} checks\n`);
}

async function waitForReadiness(frontendBaseUrl, backendBaseUrl) {
  await Promise.all([
    retryUntilReady('frontend', () => requestText('frontend readiness', frontendBaseUrl, { quiet: true })),
    retryUntilReady('backend', async () => {
      await requestJSON('backend readiness', apiUrl(backendBaseUrl, '/health'), { quiet: true });
    }),
  ]);
}

async function retryUntilReady(label, operation) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < DEFAULT_TIMEOUT_MS) {
    try {
      await operation();
      return;
    } catch (error) {
      lastError = error;
      await delay(DEFAULT_INTERVAL_MS);
    }
  }

  throw new Error(
    `${label} did not become ready in ${DEFAULT_TIMEOUT_MS / 1000}s: ${lastError?.message ?? 'unknown error'}`,
  );
}

async function requestJSON(label, url, options = {}) {
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const bodyText = await response.text();

  if (response.status !== (options.expectedStatus ?? 200)) {
    throw new Error(
      `${label} expected status ${options.expectedStatus ?? 200}, got ${response.status}: ${snippet(bodyText)}`,
    );
  }

  try {
    return JSON.parse(bodyText);
  } catch (error) {
    throw new Error(`${label} returned invalid JSON: ${error.message}`);
  }
}

async function requestText(label, url, options = {}) {
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const bodyText = await response.text();

  if (response.status !== (options.expectedStatus ?? 200)) {
    throw new Error(
      `${label} expected status ${options.expectedStatus ?? 200}, got ${response.status}: ${snippet(bodyText)}`,
    );
  }

  if (!options.quiet) {
    assert(bodyText.trim() !== '', `${label} returned an empty response`);
  }

  return bodyText;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function delay(durationMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function apiUrl(baseUrl, pathname) {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPathname = pathname.replace(/^\/+/u, '');
  return new URL(normalizedPathname, normalizedBaseUrl).toString();
}

function snippet(text) {
  return text.slice(0, 240).replace(/\s+/gu, ' ').trim();
}
