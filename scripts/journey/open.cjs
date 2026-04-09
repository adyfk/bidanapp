#!/usr/bin/env node

const path = require('node:path');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');

const repoRoot = path.resolve(__dirname, '..', '..');
const reportIndex = path.join(repoRoot, 'artifacts', 'playwright-report', 'latest', 'index.html');

const openCommand = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';

if (!fs.existsSync(reportIndex)) {
  console.error(
    `[journey] Playwright report belum tersedia di ${reportIndex}. Jalankan npm run e2e:journey terlebih dahulu.`,
  );
  process.exit(1);
}

if (process.platform === 'win32') {
  spawnSync('cmd.exe', ['/c', 'start', '', reportIndex], { stdio: 'inherit' });
} else {
  spawnSync(openCommand, [reportIndex], { stdio: 'inherit' });
}

console.log(`[journey] opened ${reportIndex}`);
