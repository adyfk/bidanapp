#!/usr/bin/env node

const {
  applyMigrations,
  checkInfra,
  checkMigrationStatus,
  checkToolchain,
  detectMigrationDrift,
  error,
  findBlockingPorts,
  info,
  inspectPorts,
  managedDevServices,
  printPortDiagnostics,
  printReadySummary,
  section,
  startService,
  syncRuntimeEnvFiles,
  terminateChildren,
  validateRuntimeEnv,
  waitForReadiness,
  warn,
} = require('./common.cjs');

async function main() {
  section('Toolchain');
  const toolchain = checkToolchain();
  for (const message of toolchain.errors) {
    error(message);
  }
  if (toolchain.errors.length > 0) {
    process.exit(1);
  }
  info('toolchain looks good');

  section('Environment');
  const syncResult = syncRuntimeEnvFiles({ writeMissing: true });
  const envStatus = validateRuntimeEnv(syncResult);
  if (syncResult.backend.created) {
    info('created apps/backend/.env from example');
  }
  for (const message of envStatus.warnings) {
    warn(message);
  }
  for (const message of envStatus.errors) {
    error(message);
  }
  if (envStatus.errors.length > 0) {
    process.exit(1);
  }
  info('env contract looks good');

  section('Infrastructure');
  const infra = await checkInfra(envStatus.backendEnv);
  if (!infra.database.ok || !infra.redis.ok) {
    if (!infra.database.ok) {
      error(`database is unreachable: ${infra.database.detail}`);
    }
    if (!infra.redis.ok) {
      error(`redis is unreachable: ${infra.redis.detail}`);
    }
    error('run `npm run infra:up` and then retry `npm run dev`');
    process.exit(1);
  }
  info('database and redis are reachable');

  section('Migrations');
  const migrations = checkMigrationStatus();
  if (!migrations.ok) {
    error(`could not inspect migrations:\n${migrations.output}`);
    process.exit(1);
  }
  if (migrations.pending) {
    info('applying pending database migrations');
    const applyResult = applyMigrations();
    if (applyResult.status !== 0) {
      const output = `${applyResult.stdout}${applyResult.stderr}`.trim();
      if (output !== '') {
        error(output);
      }
      if (detectMigrationDrift(output)) {
        error('local database drift detected; run `npm run dev:db:reset` and then retry `npm run dev`');
      } else {
        error('database migration apply failed');
      }
      process.exit(applyResult.status || 1);
    }
  } else {
    info('database migrations are already up to date');
  }

  section('Ports');
  const portStates = inspectPorts(managedDevServices);
  printPortDiagnostics(portStates);
  const blockers = findBlockingPorts(portStates, managedDevServices);
  if (blockers.length > 0) {
    for (const blocker of blockers) {
      error(
        `port ${blocker.port} for ${blocker.label} is occupied by an unrelated process (pid=${blocker.pid}, cwd=${blocker.cwd || 'unknown'})`,
      );
    }
    error('stop the conflicting process or move it away from the fixed local ports, then retry `npm run dev`');
    process.exit(1);
  }

  const alreadyRunning = portStates.filter((state) => state.inUse && state.matchesService).map((state) => state.id);
  const toStart = managedDevServices.filter((service) => !alreadyRunning.includes(service.id));

  if (alreadyRunning.length > 0) {
    info(`reusing already-running workspace services: ${alreadyRunning.join(', ')}`);
  }

  const startedChildren = [];
  const startedStates = new Map();

  for (const service of toStart) {
    info(`starting ${service.label}`);
    const child = startService(service);
    startedChildren.push(child);
    startedStates.set(service.id, { child, exited: false, code: null, signal: null });
    child.once('exit', (code, signal) => {
      startedStates.set(service.id, { child, exited: true, code, signal });
    });
  }

  const stopStartedChildren = () => terminateChildren(startedChildren);
  let shuttingDown = false;
  const handleSignal = (signal) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    info(`received ${signal}, stopping started services`);
    stopStartedChildren();
  };

  process.once('SIGINT', () => handleSignal('SIGINT'));
  process.once('SIGTERM', () => handleSignal('SIGTERM'));

  section('Readiness');
  const readinessDeadline = Date.now() + 45_000;
  while (Date.now() < readinessDeadline) {
    for (const [serviceID, state] of startedStates.entries()) {
      if (state.exited && state.code !== 0 && !shuttingDown) {
        error(
          `${serviceID} exited before readiness completed (code=${state.code ?? 'null'}, signal=${state.signal ?? 'none'})`,
        );
        stopStartedChildren();
        process.exit(state.code || 1);
      }
    }

    const readiness = await waitForReadiness({ timeoutMs: 2_000 });
    if (readiness.ok) {
      for (const result of readiness.results) {
        info(result.detail);
      }
      printReadySummary();
      break;
    }
  }

  const finalReadiness = await waitForReadiness({ timeoutMs: 2_000 });
  if (!finalReadiness.ok) {
    for (const result of finalReadiness.results) {
      if (result.ok) {
        info(result.detail);
      } else {
        error(result.detail);
      }
    }
    stopStartedChildren();
    process.exit(1);
  }

  if (startedChildren.length === 0) {
    info('all managed services were already running');
    return;
  }

  await new Promise((resolve) => {
    let remaining = startedChildren.length;
    for (const child of startedChildren) {
      child.once('exit', () => {
        remaining -= 1;
        if (remaining === 0) {
          resolve();
        }
      });
    }
  });

  if (shuttingDown) {
    process.exit(0);
  }
}

main().catch((err) => {
  error(err.stack || err.message);
  process.exit(1);
});
