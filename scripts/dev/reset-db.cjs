#!/usr/bin/env node

const {
  applyMigrations,
  checkInfra,
  checkToolchain,
  error,
  info,
  resetLocalDatabase,
  runBidanDemoSeed,
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
  const infra = await checkInfra(envStatus.backendEnv);
  if (!infra.database.ok) {
    error(`database is unreachable: ${infra.database.detail}`);
    error('run `npm run infra:up` before resetting the local database');
    process.exit(1);
  }
  info('database is reachable');

  section('Database Reset');
  info('resetting local PostgreSQL database to a clean V2 baseline');
  try {
    resetLocalDatabase(envStatus.backendEnv);
  } catch (err) {
    error(err.message);
    process.exit(1);
  }

  const migrateResult = applyMigrations();
  if (migrateResult.status !== 0) {
    error(migrateResult.stderr.trim() || migrateResult.stdout.trim() || 'failed to apply migrations after reset');
    process.exit(migrateResult.status || 1);
  }
  info('database reset and migrations completed');

  section('Demo Seed');
  info('rebuilding deterministic Bidan demo workspace');
  const seedResult = runBidanDemoSeed({ capture: false });
  if (seedResult.status !== 0) {
    error('failed to seed the Bidan demo workspace after reset');
    process.exit(seedResult.status || 1);
  }
  info('local database reset, migrations, and Bidan demo seed completed');
}

main().catch((err) => {
  error(err.stack || err.message);
  process.exit(1);
});
