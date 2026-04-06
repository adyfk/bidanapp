import { rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const frontendDir = resolve(repoRoot, 'apps/frontend');
const pathsToClear = [
  resolve(frontendDir, 'allure-results'),
  resolve(frontendDir, 'manual-qa-summary'),
  resolve(frontendDir, 'allure-report'),
  resolve(frontendDir, 'playwright-report'),
];

await Promise.all(
  pathsToClear.map(async (targetPath) => {
    await rm(targetPath, { force: true, recursive: true });
  }),
);
