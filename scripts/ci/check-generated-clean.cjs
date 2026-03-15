const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = process.cwd();
const currentSpecPath = path.join(repoRoot, 'packages/sdk/openapi.json');
const currentTypesPath = path.join(repoRoot, 'packages/sdk/src/generated/types.ts');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bidanapp-sdk-check-'));
const tempSpecPath = path.join(tempRoot, 'openapi.json');
const tempTypesPath = path.join(tempRoot, 'types.ts');

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const message = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(message || `Command failed: ${command} ${args.join(' ')}`);
  }
}

function compareFile(label, actualPath, expectedPath) {
  const actual = fs.readFileSync(actualPath, 'utf8');
  const expected = fs.readFileSync(expectedPath, 'utf8');
  return actual === expected ? null : label;
}

try {
  run('go', ['run', './cmd/openapi-export', '-json', tempSpecPath], path.join(repoRoot, 'apps/backend'));
  run(path.join(repoRoot, 'node_modules/.bin/openapi-typescript'), [tempSpecPath, '-o', tempTypesPath], repoRoot);

  const mismatches = [
    compareFile('packages/sdk/openapi.json', currentSpecPath, tempSpecPath),
    compareFile('packages/sdk/src/generated/types.ts', currentTypesPath, tempTypesPath),
  ].filter(Boolean);

  if (mismatches.length > 0) {
    console.error(
      'Generated SDK contract artifacts are out of date. Run `npm run contract:generate` and commit the result.',
    );
    console.error(`Mismatched files: ${mismatches.join(', ')}`);
    process.exit(1);
  }

  console.log('Generated SDK contract artifacts are in sync.');
} finally {
  fs.rmSync(tempRoot, { force: true, recursive: true });
}
