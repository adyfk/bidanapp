#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

for (const target of [
  path.join(repoRoot, 'artifacts', 'journeys'),
  path.join(repoRoot, 'artifacts', 'playwright-report'),
  path.join(repoRoot, 'artifacts', 'journey-atlas'),
  path.join(repoRoot, 'artifacts', 'allure-results'),
  path.join(repoRoot, 'artifacts', 'allure-report'),
]) {
  fs.rmSync(target, { force: true, recursive: true });
}

console.log('[journey] cleaned generated journey artifacts');
