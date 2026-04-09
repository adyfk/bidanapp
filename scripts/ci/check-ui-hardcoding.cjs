#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const roots = [
  path.join(process.cwd(), 'packages/web/src/components'),
  path.join(process.cwd(), 'packages/web/src/lib'),
];

const blockedPatterns = [
  /\bbg-white\b/g,
  /\bbg-black\b/g,
  /\bbg-slate(?:-[\w/[\]-]+)?\b/g,
  /\btext-slate(?:-[\w/[\]-]+)?\b/g,
  /\bborder-slate(?:-[\w/[\]-]+)?\b/g,
  /\btext-white\b/g,
];

const fileExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
const allowListedFiles = new Set([
  'packages/web/src/components/AdminLandingPage.tsx',
  'packages/web/src/components/MarketplacePublicRestored.tsx',
  'packages/web/src/components/CustomerPages.tsx',
  'packages/web/src/components/OrdersPage.tsx',
  'packages/web/src/components/ProfessionalApplyPage.tsx',
  'packages/web/src/components/ProfessionalWorkspacePage.tsx',
  'packages/web/src/components/ViewerAuthPages.tsx',
]);
const findings = [];

for (const root of roots) {
  walk(root);
}

if (findings.length) {
  console.error('UI hardcoding guard failed. Move presentational styling into packages/ui instead of packages/web.');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} -> ${finding.match}`);
  }
  process.exit(1);
}

console.log('UI hardcoding guard passed.');

function walk(currentPath) {
  if (!fs.existsSync(currentPath)) {
    return;
  }

  const stat = fs.statSync(currentPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(currentPath)) {
      walk(path.join(currentPath, entry));
    }
    return;
  }

  if (!fileExtensions.has(path.extname(currentPath))) {
    return;
  }

  const source = fs.readFileSync(currentPath, 'utf8');
  const relativePath = path.relative(process.cwd(), currentPath);

  if (allowListedFiles.has(relativePath)) {
    return;
  }

  const lines = source.split('\n');
  lines.forEach((line, index) => {
    for (const pattern of blockedPatterns) {
      const matches = line.match(pattern);
      if (!matches) {
        continue;
      }
      for (const match of matches) {
        findings.push({
          file: relativePath,
          line: index + 1,
          match,
        });
      }
    }
  });
}
