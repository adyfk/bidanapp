#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function exists(filePath) {
  return fs.existsSync(filePath);
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: options.env ?? process.env,
    stdio: options.stdio ?? 'inherit',
  });
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function walk(dirPath, predicate, bucket = []) {
  if (!exists(dirPath)) {
    return bucket;
  }

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(absolutePath, predicate, bucket);
      continue;
    }
    if (predicate(absolutePath)) {
      bucket.push(absolutePath);
    }
  }

  return bucket;
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function buildCoverage(useCases) {
  const coverage = {
    admin: [],
    auth: [],
    customer: [],
    payments: [],
    professional: [],
    public: [],
    support: [],
  };

  for (const useCase of useCases) {
    coverage[useCase.category].push(useCase.id);
  }

  return coverage;
}

function writeLatestIndex(journeyRoot) {
  const useCaseFiles = walk(journeyRoot, (filePath) => filePath.endsWith(path.join('journey.json')));
  const useCases = useCaseFiles
    .map((filePath) => readJson(filePath))
    .sort((left, right) => left.title.localeCompare(right.title));

  const runMetaPath = path.join(journeyRoot, 'run.json');
  if (!exists(runMetaPath)) {
    return;
  }

  const runMeta = readJson(runMetaPath);
  writeJson(path.join(journeyRoot, 'index.json'), {
    coverage: buildCoverage(useCases),
    meta: runMeta,
    useCases,
  });
}

function normalizeStableArtifacts(journeyRoot) {
  const useCaseFiles = walk(journeyRoot, (filePath) => filePath.endsWith(path.join('journey.json')));

  for (const filePath of useCaseFiles) {
    const useCase = readJson(filePath);
    const useCaseDir = path.dirname(filePath);
    const rewrittenAttachments = [];

    for (const attachment of useCase.attachments ?? []) {
      if ((attachment.kind === 'trace' || attachment.kind === 'video') && attachment.path) {
        const absoluteSourcePath = path.resolve(repoRoot, attachment.path);
        if (!exists(absoluteSourcePath)) {
          continue;
        }

        const targetFileName = attachment.kind === 'trace' ? 'trace.zip' : 'video.webm';
        const absoluteTargetPath = path.join(useCaseDir, targetFileName);
        fs.copyFileSync(absoluteSourcePath, absoluteTargetPath);
        const relativeTargetPath = toPosix(path.relative(repoRoot, absoluteTargetPath));
        rewrittenAttachments.push({ ...attachment, path: relativeTargetPath });
        if (attachment.kind === 'trace') {
          useCase.tracePath = relativeTargetPath;
        } else {
          useCase.videoPath = relativeTargetPath;
        }
        continue;
      }

      rewrittenAttachments.push(attachment);
    }

    useCase.attachments = rewrittenAttachments;
    writeJson(filePath, useCase);
  }
}

function main() {
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const journeyRoot = path.join(repoRoot, 'artifacts', 'journeys', 'latest');
  const playwrightRoot = path.join(journeyRoot, 'playwright');
  const playwrightReportRoot = path.join(repoRoot, 'artifacts', 'playwright-report', 'latest');

  fs.rmSync(journeyRoot, { force: true, recursive: true });
  fs.rmSync(playwrightReportRoot, { force: true, recursive: true });
  ensureDir(journeyRoot);
  ensureDir(playwrightRoot);
  ensureDir(playwrightReportRoot);

  writeJson(path.join(journeyRoot, 'run.json'), {
    runId,
    createdAt: new Date().toISOString(),
    baseUrl: 'http://bidan.lvh.me:3002',
    command: 'npm run e2e:journey',
    environment: process.env.CI ? 'ci' : 'local',
    artifactRoot: path.relative(repoRoot, journeyRoot).split(path.sep).join('/'),
    reportRoot: path.relative(repoRoot, playwrightReportRoot).split(path.sep).join('/'),
    reportHref: '/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html',
  });

  const env = {
    ...process.env,
    JOURNEY_ARTIFACT_ROOT: journeyRoot,
    JOURNEY_MODE: '1',
    JOURNEY_RUN_ID: runId,
    PLAYWRIGHT_HTML_REPORT: playwrightReportRoot,
    PLAYWRIGHT_OUTPUT_DIR: playwrightRoot,
  };

  const clearRateLimit = run(npmCommand, ['run', 'clear:auth-rate-limit', '--workspace', '@marketplace/backend'], {
    env,
  });
  if (clearRateLimit.status !== 0) {
    process.exit(clearRateLimit.status ?? 1);
  }

  const journeyRun = run(npmCommand, ['exec', '--', 'playwright', 'test', 'tests/e2e/journey'], {
    env,
  });
  normalizeStableArtifacts(journeyRoot);
  const runMetaPath = path.join(journeyRoot, 'run.json');
  if (exists(runMetaPath)) {
    const runMeta = readJson(runMetaPath);
    writeJson(runMetaPath, {
      ...runMeta,
      completedAt: new Date().toISOString(),
    });
  }
  writeLatestIndex(journeyRoot);
  process.exit(journeyRun.status ?? 1);
}

main();
