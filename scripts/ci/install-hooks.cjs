const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../..');
const gitDir = path.join(repoRoot, '.git');

if (!fs.existsSync(gitDir)) {
  console.log('Skipping lefthook install because .git is not present.');
  process.exit(0);
}

const gitCheck = spawnSync('git', ['--version'], {
  cwd: repoRoot,
  stdio: 'ignore',
});

if (gitCheck.status !== 0) {
  console.log('Skipping lefthook install because git is not available.');
  process.exit(0);
}

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const install = spawnSync(npxCommand, ['--no-install', 'lefthook', 'install'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

if (install.error) {
  console.error(`Failed to run lefthook install: ${install.error.message}`);
  process.exit(1);
}

process.exit(install.status ?? 1);
