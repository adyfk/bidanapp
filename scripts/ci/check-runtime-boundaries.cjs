#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

const ignoredDirectories = new Set(['.git', '.next', '.turbo', 'bin', 'dist', 'node_modules']);

const ignoredFiles = new Set(['package-lock.json', 'tsconfig.tsbuildinfo']);

const forbiddenPathFragments = ['apps/frontend'];

const forbiddenPatterns = [
  /\bcustomer_auth_accounts\b/g,
  /\bprofessional_auth_accounts\b/g,
  /\bconsumer_id\b/g,
  /\bprofessional_id\b/g,
  /\/customers\/auth\//g,
  /\/professionals\/auth\//g,
  /\/customers\/appointments\b/g,
  /\/professionals\/appointments\b/g,
  /\/appointments\b/g,
  /internal\/modules\/appointments\b/g,
  /internal\/modules\/customerauth\b/g,
  /internal\/modules\/professionalauth\b/g,
  /internal\/modules\/professionalportal\b/g,
  /internal\/modules\/readmodel\b/g,
  /internal\/modules\/clientstate\b/g,
  /appointmentstore\b/g,
  /contentstore\b/g,
  /documentstore\b/g,
  /portalstore\b/g,
  /pushstore\b/g,
];

const importBoundaryChecks = [
  {
    appliesTo: (relativePath) => relativePath.startsWith('apps/'),
    patterns: [
      {
        pattern: /from ['"]@marketplace\/sdk['"]/g,
        message: 'apps must not import @marketplace/sdk directly',
      },
      {
        pattern: /from ['"]@marketplace\/(?:web|ui|marketplace-core|platform-config|sdk)\/src\//g,
        message: 'apps must only import package public entrypoints',
      },
    ],
  },
  {
    appliesTo: (relativePath) => relativePath.startsWith('packages/ui/'),
    patterns: [
      {
        pattern: /from ['"]@marketplace\/sdk['"]/g,
        message: 'packages/ui must not import sdk',
      },
      {
        pattern: /from ['"]@marketplace\/marketplace-core['"]/g,
        message: 'packages/ui must not import marketplace-core',
      },
      {
        pattern: /from ['"]@marketplace\/web['"]/g,
        message: 'packages/ui must not import web',
      },
    ],
  },
  {
    appliesTo: (relativePath) => relativePath.startsWith('packages/web/'),
    patterns: [
      {
        pattern: /from ['"]@marketplace\/sdk['"]/g,
        message: 'packages/web must use marketplace-core, not sdk directly',
      },
      {
        pattern: /from ['"]@marketplace\/(?:ui|marketplace-core|platform-config|sdk)\/src\//g,
        message: 'packages/web must only import package public entrypoints',
      },
    ],
  },
];

const issues = [];

walk(repoRoot);

if (issues.length > 0) {
  console.error('Runtime boundary violations found:');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(repoRoot, absolutePath);

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }
      if (forbiddenPathFragments.some((fragment) => relativePath.includes(fragment))) {
        issues.push(`${relativePath}: forbidden path`);
        continue;
      }
      walk(absolutePath);
      continue;
    }

    if (ignoredFiles.has(entry.name) || entry.name.endsWith('.tsbuildinfo')) {
      continue;
    }
    if (relativePath === 'scripts/ci/check-runtime-boundaries.cjs') {
      continue;
    }
    if (forbiddenPathFragments.some((fragment) => relativePath.includes(fragment))) {
      issues.push(`${relativePath}: forbidden path`);
      continue;
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        issues.push(`${relativePath}: matches ${pattern}`);
      }
      pattern.lastIndex = 0;
    }

    for (const rule of importBoundaryChecks) {
      if (!rule.appliesTo(relativePath)) {
        continue;
      }

      for (const { message, pattern } of rule.patterns) {
        if (pattern.test(content)) {
          issues.push(`${relativePath}: ${message}`);
        }
        pattern.lastIndex = 0;
      }
    }

    if (relativePath.startsWith('packages/web/src/') && !relativePath.startsWith('packages/web/src/components/')) {
      const legacyComponentImportPattern = /from ['"][^'"]*components\//g;
      if (legacyComponentImportPattern.test(content)) {
        issues.push(`${relativePath}: packages/web active graph must not import legacy components`);
      }
      legacyComponentImportPattern.lastIndex = 0;
    }
  }
}
