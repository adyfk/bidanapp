#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const defaultIndexPath = path.join(repoRoot, 'artifacts', 'journeys', 'latest', 'index.json');
const defaultOutputPath = path.join(repoRoot, 'docs', 'ui-screenshot-gallery.md');
const categoryOrder = ['public', 'auth', 'customer', 'payments', 'support', 'professional', 'admin'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeMarkdown(value) {
  return String(value ?? '').replaceAll('|', '\\|');
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function flattenScreenshotSteps(index) {
  return (index.useCases ?? []).flatMap((useCase) =>
    (useCase.steps ?? [])
      .filter((step) => step.screenshotPath)
      .map((step, stepIndex) => ({
        category: useCase.category || 'uncategorized',
        expectedResult: step.expectedResult || '',
        persona: useCase.seed?.credentialLabel || useCase.persona || useCase.seed?.actor || 'Unspecified',
        route: step.routeId || step.url || '-',
        screenshotPath: step.screenshotPath,
        screenId: step.screenId || step.id || '-',
        status: step.status || useCase.status || '-',
        stepIndex: stepIndex + 1,
        title: step.title || step.id,
        url: step.url || '',
        useCaseId: useCase.id,
        useCaseTitle: useCase.title,
        viewport: step.viewport ? `${step.viewport.width}x${step.viewport.height}` : '-',
      })),
  );
}

function renderCard(step, outputPath) {
  const imageHref = toPosix(path.relative(path.dirname(outputPath), path.join(repoRoot, step.screenshotPath)));
  const urlLine =
    step.url && step.url !== step.route ? `<br><strong>URL:</strong> <code>${escapeHtml(step.url)}</code>` : '';

  return [
    '<td width="50%" valign="top">',
    `<a href="../${escapeHtml(step.screenshotPath)}"><img src="${escapeHtml(imageHref)}" alt="${escapeHtml(
      `${step.useCaseId} - ${step.title}`,
    )}" width="100%" /></a>`,
    `<br><strong>${escapeHtml(step.title)}</strong>`,
    `<br><code>${escapeHtml(step.useCaseId)}</code>`,
    `<br><strong>Route:</strong> <code>${escapeHtml(step.route)}</code>`,
    urlLine,
    `<br><strong>Persona:</strong> ${escapeHtml(step.persona)}`,
    `<br><strong>Viewport:</strong> <code>${escapeHtml(step.viewport)}</code>`,
    `<br><strong>State:</strong> <code>${escapeHtml(step.screenId)}</code>`,
    `<br><strong>Path:</strong> <code>${escapeHtml(step.screenshotPath)}</code>`,
    `<br><strong>Status:</strong> ${escapeHtml(step.status)}`,
    step.expectedResult ? `<br><strong>Note:</strong> ${escapeHtml(step.expectedResult)}` : '',
    '</td>',
  ]
    .filter(Boolean)
    .join('\n');
}

function renderGallery(index, outputPath) {
  const steps = flattenScreenshotSteps(index);
  const runMeta = index.meta ?? {};
  const screenshotCount = steps.length;
  const useCaseCount = index.useCases?.length ?? 0;
  const passedUseCaseCount = (index.useCases ?? []).filter((useCase) => useCase.status === 'passed').length;
  const lines = [
    '# UI Screenshot Gallery',
    '',
    'Satu tempat untuk review visual semua screenshot journey terbaru.',
    '',
    '## Run Meta',
    '',
    `- Run id: \`${escapeMarkdown(runMeta.runId || '-')}\``,
    `- Command: \`${escapeMarkdown(runMeta.command || '-')}\``,
    `- Base URL: \`${escapeMarkdown(runMeta.baseUrl || '-')}\``,
    `- Hasil: \`${passedUseCaseCount}/${useCaseCount} use case passed\``,
    `- Screenshot: \`${screenshotCount}\``,
    `- Index: \`artifacts/journeys/latest/index.json\``,
    `- Report: \`artifacts/playwright-report/latest/index.html\``,
    '',
    '## Cara Pakai',
    '',
    '- Baca dari gambar dulu, bukan matrix teks.',
    '- Gunakan `Persona`, `Route`, dan `State` untuk tahu posisi user dan konteks layar.',
    '- Gunakan `Path` untuk membuka file screenshot langsung bila perlu zoom detail.',
    '',
  ];

  const categories = [...new Set(steps.map((step) => step.category))].sort((left, right) => {
    const leftIndex = categoryOrder.indexOf(left);
    const rightIndex = categoryOrder.indexOf(right);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex) || left.localeCompare(right);
  });

  for (const category of categories) {
    const categorySteps = steps.filter((step) => step.category === category);
    lines.push(`## ${category[0].toUpperCase()}${category.slice(1)}`, '');

    for (const useCaseId of [...new Set(categorySteps.map((step) => step.useCaseId))]) {
      const useCaseSteps = categorySteps.filter((step) => step.useCaseId === useCaseId);
      lines.push(`### ${useCaseSteps[0]?.useCaseTitle || useCaseId}`, '');
      lines.push('<table>');
      for (const row of chunk(useCaseSteps, 2)) {
        lines.push('<tr>');
        lines.push(row.map((step) => renderCard(step, outputPath)).join('\n'));
        if (row.length === 1) {
          lines.push('<td width="50%"></td>');
        }
        lines.push('</tr>');
      }
      lines.push('</table>', '');
    }
  }

  return `${lines.join('\n')}\n`;
}

function main() {
  const indexPath = process.argv[2] ? path.resolve(repoRoot, process.argv[2]) : defaultIndexPath;
  const outputPath = process.argv[3] ? path.resolve(repoRoot, process.argv[3]) : defaultOutputPath;

  if (!fs.existsSync(indexPath)) {
    throw new Error(`Journey index not found: ${indexPath}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderGallery(readJson(indexPath), outputPath), 'utf8');
  console.log(`wrote ${toPosix(path.relative(repoRoot, outputPath))}`);
}

main();
