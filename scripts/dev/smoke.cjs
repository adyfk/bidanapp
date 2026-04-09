#!/usr/bin/env node

const { error, info, runSmokeChecks, section } = require('./common.cjs');

async function main() {
  section('Smoke Checks');
  const results = await runSmokeChecks();
  let hasErrors = false;

  for (const result of results) {
    if (result.ok) {
      info(result.detail);
      continue;
    }
    hasErrors = true;
    error(result.detail);
  }

  if (hasErrors) {
    process.exit(1);
  }
}

main().catch((err) => {
  error(err.stack || err.message);
  process.exit(1);
});
