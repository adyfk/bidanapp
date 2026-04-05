import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  PLAYWRIGHT_WEB_PUSH_PRIVATE_KEY,
  PLAYWRIGHT_WEB_PUSH_PUBLIC_KEY,
  PLAYWRIGHT_WEB_PUSH_SUBJECT,
} from './web-push-test-keys.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');
const backendDir = path.join(repoRoot, 'apps', 'backend');
const composeFile = path.join(repoRoot, 'docker-compose.dev.yml');
const backendPort = process.env.HTTP_PORT ?? process.env.PLAYWRIGHT_BACKEND_PORT ?? '3302';
const frontendOrigin = process.env.PLAYWRIGHT_FRONTEND_ORIGIN ?? 'http://127.0.0.1:3301';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: { ...process.env, ...options.env },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${String(result.status)}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertDockerReady() {
  const result = spawnSync('docker', ['info'], {
    cwd: repoRoot,
    env: process.env,
    stdio: 'ignore',
  });

  if (result.status === 0) {
    return;
  }

  throw new Error(
    'Docker daemon is not available. Start Docker Desktop or another daemon before running PLAYWRIGHT_BACKEND_MODE=seeded.',
  );
}

async function waitForDatabaseReady(maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = spawnSync(
      'docker',
      ['compose', '-f', composeFile, 'exec', '-T', 'postgres', 'pg_isready', '-U', 'postgres', '-d', 'bidanapp'],
      {
        cwd: repoRoot,
        env: process.env,
        stdio: 'ignore',
      },
    );

    if (result.status === 0) {
      return;
    }

    await sleep(1_000);
  }

  throw new Error('PostgreSQL did not become ready in time for Playwright E2E.');
}

async function main() {
  assertDockerReady();
  run('docker', ['compose', '-f', composeFile, 'up', '-d', 'postgres', 'redis']);
  await waitForDatabaseReady();

  const sharedEnv = {
    APP_ENV: process.env.APP_ENV ?? 'test',
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS ?? frontendOrigin,
    DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:5432/bidanapp?sslmode=disable',
    HTTP_HOST: '127.0.0.1',
    HTTP_PORT: String(backendPort),
    LOG_LEVEL: process.env.LOG_LEVEL ?? 'warn',
    REDIS_URL: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
    WEB_PUSH_PRIVATE_KEY: process.env.WEB_PUSH_PRIVATE_KEY ?? PLAYWRIGHT_WEB_PUSH_PRIVATE_KEY,
    WEB_PUSH_PUBLIC_KEY: process.env.WEB_PUSH_PUBLIC_KEY ?? PLAYWRIGHT_WEB_PUSH_PUBLIC_KEY,
    WEB_PUSH_SUBJECT: process.env.WEB_PUSH_SUBJECT ?? PLAYWRIGHT_WEB_PUSH_SUBJECT,
  };

  run('npm', ['run', 'atlas:apply', '--workspace', '@bidanapp/backend'], {
    cwd: repoRoot,
    env: sharedEnv,
  });
  run('npm', ['run', 'seed', '--workspace', '@bidanapp/backend'], {
    cwd: repoRoot,
    env: sharedEnv,
  });

  const server = spawn('go', ['run', './cmd/api'], {
    cwd: backendDir,
    env: {
      ...process.env,
      ...sharedEnv,
    },
    stdio: 'inherit',
  });

  const forwardSignal = (signal) => {
    if (server.exitCode === null) {
      server.kill(signal);
    }
  };

  process.on('SIGINT', () => forwardSignal('SIGINT'));
  process.on('SIGTERM', () => forwardSignal('SIGTERM'));

  server.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
