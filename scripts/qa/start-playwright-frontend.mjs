import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, cp, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');
const frontendDir = path.join(repoRoot, 'apps', 'frontend');
const envLocalPath = path.join(frontendDir, '.env.local');
const envBackupPath = path.join(frontendDir, '.env.local.playwright-backup');
const frontendPort = process.env.PLAYWRIGHT_FRONTEND_PORT ?? '3301';
const backendApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? `http://127.0.0.1:${process.env.HTTP_PORT ?? '3302'}/api/v1`;

let restored = false;
let hadOriginalEnvLocal = false;

function buildChildEnv(overrides = {}) {
  const env = { ...process.env, ...overrides };

  // Keep Playwright startup logs quiet when the parent shell injects conflicting color flags.
  delete env.NO_COLOR;

  return env;
}

async function restoreEnvFile() {
  if (restored) {
    return;
  }

  restored = true;

  if (hadOriginalEnvLocal && existsSync(envBackupPath)) {
    await rename(envBackupPath, envLocalPath);
    return;
  }

  if (existsSync(envLocalPath)) {
    await rm(envLocalPath, { force: true });
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? frontendDir,
    env: buildChildEnv(options.env),
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${String(result.status)}`);
  }
}

async function prepareStandaloneAssets() {
  const standaloneAppDir = path.join(frontendDir, '.next', 'standalone', 'apps', 'frontend');
  const standaloneServerPath = path.join(standaloneAppDir, 'server.js');
  if (!existsSync(standaloneServerPath)) {
    return null;
  }

  const standaloneStaticDir = path.join(standaloneAppDir, '.next', 'static');
  const sourceStaticDir = path.join(frontendDir, '.next', 'static');
  const standalonePublicDir = path.join(standaloneAppDir, 'public');
  const sourcePublicDir = path.join(frontendDir, 'public');

  await mkdir(path.dirname(standaloneStaticDir), { recursive: true });
  await rm(standaloneStaticDir, { force: true, recursive: true });
  await cp(sourceStaticDir, standaloneStaticDir, { recursive: true });

  if (existsSync(sourcePublicDir)) {
    await rm(standalonePublicDir, { force: true, recursive: true });
    await cp(sourcePublicDir, standalonePublicDir, { recursive: true });
  }

  return {
    cwd: standaloneAppDir,
    serverPath: standaloneServerPath,
  };
}

async function main() {
  hadOriginalEnvLocal = existsSync(envLocalPath);

  if (hadOriginalEnvLocal) {
    if (existsSync(envBackupPath)) {
      await rm(envBackupPath, { force: true });
    }

    await copyFile(envLocalPath, envBackupPath);
  }

  const playwrightEnv = [
    `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:${frontendPort}`,
    `NEXT_PUBLIC_API_BASE_URL=${backendApiBaseUrl}`,
    'NEXT_PUBLIC_APP_VERSION=playwright',
    'NEXT_PUBLIC_PROFESSIONAL_PORTAL_DATA_SOURCE=api',
    'NEXT_PUBLIC_APP_STATE_DATA_SOURCE=api',
    'NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED=true',
  ].join('\n');

  await writeFile(envLocalPath, `${playwrightEnv}\n`, 'utf8');
  await rm(path.join(frontendDir, '.next'), { force: true, recursive: true });

  run('node', ['../../node_modules/next/dist/bin/next', 'build'], {
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
    },
  });

  const standaloneRuntime = await prepareStandaloneAssets();
  const server = standaloneRuntime
    ? spawn('node', [standaloneRuntime.serverPath], {
        cwd: standaloneRuntime.cwd,
        env: buildChildEnv({
          HOSTNAME: '127.0.0.1',
          NEXT_TELEMETRY_DISABLED: '1',
          PORT: frontendPort,
        }),
        stdio: 'inherit',
      })
    : spawn(
        'node',
        ['../../node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', frontendPort],
        {
          cwd: frontendDir,
          env: buildChildEnv({
            NEXT_TELEMETRY_DISABLED: '1',
          }),
          stdio: 'inherit',
        },
      );

  const cleanupAndExit = async (code, signal) => {
    await restoreEnvFile();

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  };

  process.on('SIGINT', () => {
    if (server.exitCode === null) {
      server.kill('SIGINT');
    }
  });
  process.on('SIGTERM', () => {
    if (server.exitCode === null) {
      server.kill('SIGTERM');
    }
  });

  server.on('exit', (code, signal) => {
    void cleanupAndExit(code, signal);
  });
}

main().catch(async (error) => {
  await restoreEnvFile();
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
