const { spawnSync } = require('node:child_process');

const prTitle = (process.env.PR_TITLE || '').trim();
const baseRef = (process.env.BASE_REF || 'main').trim();

if (!prTitle) {
  console.error('PR_TITLE is required.');
  process.exit(1);
}

const match = prTitle.match(/^([a-z]+)(\([^)]+\))?(!)?:\s.+$/);
if (!match) {
  console.error(
    `PR title must start with an allowed prefix such as feat:, fix:, or chore: before checking changesets. Received: ${prTitle}`,
  );
  process.exit(1);
}

const type = match[1];
const breaking = Boolean(match[3]);
const releaseTypes = new Set(['feat', 'fix', 'perf', 'revert']);
const requiresChangeset = breaking || releaseTypes.has(type);

if (!requiresChangeset) {
  console.log(`No changeset required for PR title type "${type}".`);
  process.exit(0);
}

const runGit = (args) => {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const message = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(message || `Unable to run git ${args.join(' ')}.`);
  }

  return result.stdout
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean);
};

let changedFiles = [];

try {
  changedFiles = [
    ...runGit(['diff', '--name-only', `origin/${baseRef}...HEAD`]),
    ...runGit(['diff', '--name-only', '--cached']),
    ...runGit(['ls-files', '--others', '--exclude-standard']),
  ];
} catch (error) {
  console.error(error.message || `Unable to diff against origin/${baseRef}.`);
  process.exit(1);
}

const hasChangeset = changedFiles.some(
  (file) => file.startsWith('.changeset/') && file.endsWith('.md') && file !== '.changeset/README.md',
);

if (!hasChangeset) {
  console.error(
    `PR title "${prTitle}" requires a changeset. Run \`npm run changeset\` and select @marketplace/release.`,
  );
  process.exit(1);
}

console.log('Changeset found for release-worthy PR.');
