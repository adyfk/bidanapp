const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const changesetDir = path.join(repoRoot, '.changeset');
const releasePackagePath = path.join(repoRoot, 'packages/release/package.json');
const releaseChangelogPath = path.join(repoRoot, 'packages/release/CHANGELOG.md');
const artifactsDir = path.join(repoRoot, '.artifacts');

function bin(name) {
  return path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: options.captureOutput ? 'pipe' : 'inherit',
    env: options.env || process.env,
  });

  if (result.status !== 0) {
    const message = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(message || `Command failed: ${command} ${args.join(' ')}`);
  }

  return result;
}

function pendingChangesetFiles() {
  return fs
    .readdirSync(changesetDir)
    .filter((entry) => entry.endsWith('.md') && entry !== 'README.md')
    .sort();
}

function parseChangeset(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { body: content.trim(), releases: [] };
  }

  const releases = match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const releaseMatch = line.match(/^["']?([^"']+)["']?:\s*(major|minor|patch)$/);
      return releaseMatch ? { name: releaseMatch[1], type: releaseMatch[2] } : null;
    })
    .filter(Boolean);

  return { body: match[2].trim(), releases };
}

function readReleaseVersion() {
  const parsed = JSON.parse(fs.readFileSync(releasePackagePath, 'utf8'));
  return parsed.version;
}

function nextVersion(currentVersion, releaseType) {
  const [major, minor, patch] = currentVersion.split('.').map((value) => Number(value));

  if (releaseType === 'major') {
    return `${major + 1}.0.0`;
  }

  if (releaseType === 'minor') {
    return `${major}.${minor + 1}.0`;
  }

  return `${major}.${minor}.${patch + 1}`;
}

function extractReleaseNotes(version) {
  const changelog = fs.readFileSync(releaseChangelogPath, 'utf8');
  const marker = `## ${version}`;
  const start = changelog.indexOf(marker);
  if (start === -1) {
    return `## ${version}`;
  }

  const afterStart = changelog.slice(start);
  const nextHeader = afterStart.indexOf('\n## ', marker.length);
  return (nextHeader === -1 ? afterStart : afterStart.slice(0, nextHeader)).trim();
}

async function publishReleaseRecord({ gitHead, notes, tag, version }) {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const serverUrl = process.env.GITHUB_SERVER_URL;

  if (!token) {
    throw new Error('GITHUB_TOKEN is required to publish a release.');
  }

  if (!repository || !serverUrl) {
    throw new Error('GITHUB_REPOSITORY and GITHUB_SERVER_URL are required to publish a release.');
  }

  const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/v1/repos/${repository}/releases`, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      body: notes,
      draft: false,
      name: tag,
      prerelease: false,
      tag_name: tag,
      target_commitish: gitHead,
    }),
  });

  if (!response.ok && response.status !== 409) {
    throw new Error(`Release publish failed with status ${response.status}: ${await response.text()}`);
  }

  const url =
    response.status === 409
      ? `${serverUrl.replace(/\/$/, '')}/${repository}/releases/tag/${tag}`
      : (await response.json()).html_url;

  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.writeFileSync(
    path.join(artifactsDir, 'release-metadata.json'),
    `${JSON.stringify({ gitHead, gitTag: tag, notes, version }, null, 2)}\n`,
  );

  return url;
}

async function main() {
  const pending = pendingChangesetFiles();
  if (pending.length === 0) {
    console.log('No pending changesets. Skipping release.');
    return;
  }

  if (dryRun) {
    const releaseOrder = { patch: 1, minor: 2, major: 3 };
    const currentVersion = readReleaseVersion();
    const highestReleaseType = pending.reduce((current, fileName) => {
      const changeset = parseChangeset(fs.readFileSync(path.join(changesetDir, fileName), 'utf8'));
      const release = changeset.releases.find((entry) => entry.name === '@marketplace/release');
      if (!release) {
        return current;
      }

      if (!current || releaseOrder[release.type] > releaseOrder[current]) {
        return release.type;
      }

      return current;
    }, null);

    if (!highestReleaseType) {
      console.log('No release change found for @marketplace/release. Skipping release.');
      return;
    }

    const version = nextVersion(currentVersion, highestReleaseType);
    const tag = `v${version}`;
    console.log(`Next release: ${tag}`);
    console.log(`Release type: ${highestReleaseType}`);
    console.log(`Pending changesets: ${pending.join(', ')}`);
    return;
  }

  run(bin('changeset'), ['version'], {
    env: {
      ...process.env,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    },
  });

  const version = readReleaseVersion();
  const tag = `v${version}`;
  const notes = extractReleaseNotes(version);

  if (dryRun) {
    console.log(`Next release: ${tag}`);
    console.log(notes);
    return;
  }

  run('git', [
    'add',
    '.changeset',
    'package-lock.json',
    'packages/release/package.json',
    'packages/release/CHANGELOG.md',
  ]);
  run('git', ['commit', '-m', `chore(release): ${tag}`]);
  run('git', ['tag', tag]);
  run('git', ['push', 'origin', 'HEAD:main']);
  run('git', ['push', 'origin', tag]);

  const gitHead = run('git', ['rev-parse', 'HEAD'], { captureOutput: true }).stdout.trim();
  const releaseUrl = await publishReleaseRecord({ gitHead, notes, tag, version });

  console.log(`Published release ${tag}: ${releaseUrl}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
