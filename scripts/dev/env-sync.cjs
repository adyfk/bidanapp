#!/usr/bin/env node

const { error, info, section, syncRuntimeEnvFiles, validateRuntimeEnv, warn } = require('./common.cjs');

function main() {
  section('Env Sync');
  const syncResult = syncRuntimeEnvFiles({ writeMissing: true });
  const validation = validateRuntimeEnv(syncResult);

  if (syncResult.backend.created) {
    info('created apps/backend/.env from example');
  }

  for (const message of validation.warnings) {
    warn(message);
  }

  if (validation.errors.length > 0) {
    for (const message of validation.errors) {
      error(message);
    }
    process.exit(1);
  }

  info('environment files are synchronized');
}

main();
