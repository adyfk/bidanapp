import { spawnSync } from 'node:child_process';
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const summaryPath = resolve(repoRoot, 'apps/frontend/manual-qa-summary/index.html');

try {
  await access(summaryPath, constants.F_OK);
} catch {
  console.error('No manual QA summary page found.');
  console.error('Run one of these first:');
  console.error('  npm run test:e2e:frontend:evidence:seeded -- --grep "PUB-01"');
  console.error('  npm run manual-qa:summary:generate:frontend');
  process.exit(1);
}

const platform = process.platform;
let command = null;
let args = [];

if (platform === 'darwin') {
  command = 'open';
  args = [summaryPath];
} else if (platform === 'win32') {
  command = 'cmd';
  args = ['/c', 'start', '', summaryPath];
} else {
  command = 'xdg-open';
  args = [summaryPath];
}

const opened = spawnSync(command, args, {
  cwd: repoRoot,
  stdio: 'inherit',
});

if (typeof opened.status === 'number') {
  process.exit(opened.status);
}

process.exit(1);
