#!/usr/bin/env node

const {
  applyMigrations,
  checkInfra,
  checkMigrationStatus,
  checkToolchain,
  detectMigrationDrift,
  error,
  info,
  repoRoot,
  runBidanDemoSeed,
  runNpmSync,
  section,
  syncRuntimeEnvFiles,
  validateRuntimeEnv,
  warn,
} = require('./common.cjs');

async function main() {
  section('Toolchain');
  const toolchain = checkToolchain({ requireDocker: true });
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
  info('environment files are ready');

  section('Infrastructure');
  let infra = await checkInfra(envStatus.backendEnv);
  if (!infra.database.ok || !infra.redis.ok) {
    if ((infra.database.local && !infra.database.ok) || (infra.redis.local && !infra.redis.ok)) {
      info('starting local infra with docker compose');
      const infraUp = runNpmSync(['run', 'infra:up'], { cwd: repoRoot, capture: false });
      if (infraUp.status !== 0) {
        error('failed to start local infra with npm run infra:up');
        process.exit(infraUp.status || 1);
      }
      infra = await checkInfra(envStatus.backendEnv);
    }
  }

  if (!infra.database.ok) {
    error(`database is unreachable: ${infra.database.detail}`);
    process.exit(1);
  }
  if (!infra.redis.ok) {
    error(`redis is unreachable: ${infra.redis.detail}`);
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
        error('local database drift detected; run `npm run dev:db:reset` and then retry `npm run dev:setup`');
      } else {
        error('database migration apply failed');
      }
      process.exit(applyResult.status || 1);
    }
  } else {
    info('database migrations are already up to date');
  }

  section('Demo Seed');
  info('seeding deterministic Bidan demo workspace');
  const seedResult = runBidanDemoSeed({ capture: false });
  if (seedResult.status !== 0) {
    error('failed to seed the Bidan demo workspace');
    process.exit(seedResult.status || 1);
  }
  info('Bidan demo workspace is ready for local QA');
}

main().catch((err) => {
  error(err.stack || err.message);
  process.exit(1);
});
