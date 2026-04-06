import { spawnSync } from 'node:child_process';
import { constants } from 'node:fs';
import { access, readdir, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const traceRoot = resolve(repoRoot, 'apps/frontend/test-results');

const ensureFileExists = async (filePath) => {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const collectTraceArchives = async (directory) => {
  if (!(await ensureFileExists(directory))) {
    return [];
  }

  const entries = await readdir(directory, { withFileTypes: true });
  const traces = [];

  for (const entry of entries) {
    const absolutePath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      traces.push(...(await collectTraceArchives(absolutePath)));
      continue;
    }

    if (entry.isFile() && entry.name === 'trace.zip') {
      const metadata = await stat(absolutePath);
      traces.push({
        modifiedAtMs: metadata.mtimeMs,
        path: absolutePath,
        relativePath: relative(repoRoot, absolutePath),
      });
    }
  }

  return traces;
};

const selectTraceArchive = async (input) => {
  const trimmedInput = input.trim();

  if (trimmedInput) {
    const explicitCandidates = [resolve(process.cwd(), trimmedInput), resolve(repoRoot, trimmedInput)];

    for (const candidate of explicitCandidates) {
      if (await ensureFileExists(candidate)) {
        return {
          modifiedAtMs: Number.MAX_SAFE_INTEGER,
          path: candidate,
          relativePath: relative(repoRoot, candidate),
        };
      }
    }
  }

  const traces = await collectTraceArchives(traceRoot);

  if (traces.length === 0) {
    return null;
  }

  traces.sort((left, right) => right.modifiedAtMs - left.modifiedAtMs);

  if (!trimmedInput) {
    return traces[0];
  }

  const normalizedInput = trimmedInput.toLowerCase();
  const matches = traces.filter((trace) => trace.relativePath.toLowerCase().includes(normalizedInput));

  return matches[0] ?? null;
};

const requestedTarget = process.argv.slice(2).join(' ').trim();
const selectedTrace = await selectTraceArchive(requestedTarget);

if (!selectedTrace) {
  const qualifier = requestedTarget ? ` matching "${requestedTarget}"` : '';
  console.error(`No Playwright trace archive found${qualifier}.`);
  console.error('Run one of these first:');
  console.error('  npm run test:e2e:frontend:trace');
  console.error('  npm run test:e2e:frontend:trace:seeded -- --grep "PUB-01"');
  process.exit(1);
}

console.log(`Opening Playwright trace: ${selectedTrace.relativePath}`);

const traceViewer = spawnSync('npx', ['playwright', 'show-trace', selectedTrace.path], {
  cwd: repoRoot,
  stdio: 'inherit',
});

if (typeof traceViewer.status === 'number') {
  process.exit(traceViewer.status);
}

process.exit(1);
