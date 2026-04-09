#!/usr/bin/env node

const {
  checkInfra,
  checkMigrationStatus,
  checkToolchain,
  error,
  findBlockingPorts,
  info,
  inspectPorts,
  printPortDiagnostics,
  section,
  syncRuntimeEnvFiles,
  validateRuntimeEnv,
  warn,
} = require('./common.cjs');

async function main() {
  let hasErrors = false;

  section('Toolchain');
  const toolchain = checkToolchain();
  for (const message of toolchain.warnings) {
    warn(message);
  }
  for (const message of toolchain.errors) {
    error(message);
    hasErrors = true;
  }
  if (toolchain.errors.length === 0) {
    info('toolchain looks good');
  }

  section('Environment');
  const syncResult = syncRuntimeEnvFiles({ writeMissing: false });
  const envStatus = validateRuntimeEnv(syncResult);
  for (const message of envStatus.warnings) {
    warn(message);
  }
  for (const message of envStatus.errors) {
    error(message);
    hasErrors = true;
  }
  if (envStatus.errors.length === 0) {
    info('env contract looks good');
  }

  section('Infrastructure');
  if (envStatus.errors.length === 0) {
    const infra = await checkInfra(envStatus.backendEnv);
    if (infra.database.ok) {
      info(`database reachable at ${infra.database.detail}`);
    } else {
      error(`database is unreachable: ${infra.database.detail}`);
      hasErrors = true;
    }

    if (infra.redis.ok) {
      info(`redis reachable at ${infra.redis.detail}`);
    } else {
      error(`redis is unreachable: ${infra.redis.detail}`);
      hasErrors = true;
    }

    if (infra.database.ok) {
      section('Migrations');
      const migrations = checkMigrationStatus();
      if (!migrations.ok) {
        error(`could not inspect migrations:\n${migrations.output}`);
        hasErrors = true;
      } else if (migrations.pending) {
        warn('database migrations are still pending');
      } else {
        info('database migrations are up to date');
      }
    }
  } else {
    warn('skipping infra and migration checks until env issues are fixed');
  }

  section('Ports');
  const portStates = inspectPorts();
  printPortDiagnostics(portStates);
  const blockers = findBlockingPorts(portStates);
  if (blockers.length > 0) {
    hasErrors = true;
    for (const blocker of blockers) {
      error(
        `port ${blocker.port} for ${blocker.label} is occupied by an unrelated process (pid=${blocker.pid}, cwd=${blocker.cwd || 'unknown'})`,
      );
    }
  }

  if (hasErrors) {
    process.exit(1);
  }
}

main().catch((err) => {
  error(err.stack || err.message);
  process.exit(1);
});
