const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const prTitle = process.env.PR_TITLE || readEventPayload()?.pull_request?.title || '';

if (!prTitle) {
  console.error('Pull request title is required. Set PR_TITLE or provide a CI event payload.');
  process.exit(1);
}

const commitlintBin = path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'commitlint.cmd' : 'commitlint',
);

const result = spawnSync(commitlintBin, ['--verbose'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  input: `${prTitle}\n`,
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Pull request title valid: ${prTitle}`);

function readEventPayload() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(eventPath, 'utf8'));
}
