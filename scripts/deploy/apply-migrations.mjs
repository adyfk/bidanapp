#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { parseEnvFile, resolveEnvFile } from './lib/env-file.mjs';

main();

function main() {
  const envFileArg = process.argv[2];
  if (!envFileArg) {
    process.stderr.write('usage: node ./scripts/deploy/apply-migrations.mjs <env-file>\n');
    process.exit(1);
  }

  const envFile = resolveEnvFile(envFileArg);
  const env = parseEnvFile(envFile);
  const migrationDatabaseUrl =
    process.env.MIGRATION_DATABASE_URL ?? env.MIGRATION_DATABASE_URL ?? buildHostDatabaseUrl(env);
  const atlasImage = process.env.ATLAS_IMAGE ?? 'arigaio/atlas:latest';
  const backendDir = path.resolve(process.cwd(), 'apps/backend');

  process.stdout.write(`applying Atlas migrations using ${envFile}\n`);

  const result = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '--add-host=host.docker.internal:host-gateway',
      '-v',
      `${backendDir}:/workspace`,
      '-w',
      '/workspace',
      atlasImage,
      'migrate',
      'apply',
      '--env',
      'local',
      '--var',
      `db_url=${migrationDatabaseUrl}`,
    ],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
    },
  );

  if (result.error) {
    process.stderr.write(`failed to run Atlas migrations: ${result.error.message}\n`);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

function buildHostDatabaseUrl(env) {
  const databaseUrl = env.DATABASE_URL?.trim() ?? '';
  const postgresPort = env.POSTGRES_PORT?.trim() ?? '';

  if (databaseUrl === '') {
    throw new Error('DATABASE_URL must not be empty');
  }

  if (postgresPort === '') {
    throw new Error('POSTGRES_PORT must not be empty');
  }

  const parsed = new URL(databaseUrl);
  parsed.hostname = 'host.docker.internal';
  parsed.port = postgresPort;
  return parsed.toString();
}
