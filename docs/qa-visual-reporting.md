# QA Storyboard Workflow

This repository keeps the browser QA toolchain intentionally small and readable.

The redundant layers have been removed completely:

- no Playwright HTML report workflow
- no generated Allure HTML report workflow
- no separate report-opening flow for those removed outputs

What remains is the toolchain that still has a distinct job:

- Playwright seeded E2E to generate deterministic browser evidence
- Trace Viewer for step-by-step debugging
- the manual QA summary page for storyboard-style documentation

The intended flow is simple:

1. capture evidence or traces
2. generate the storyboard page when you need the readable document
3. open a trace only when you need deep debugging detail

## Current Tooling

### 1. Trace Viewer

Use this when you need to inspect exactly what happened inside one run:

- navigation order
- DOM timeline
- console and network context
- case-specific replay through `trace.zip`

Read the detailed workflow in [Playwright Trace Viewer Guide](./playwright-trace-viewer.md).

### 2. Manual QA summary page

Use this when you want the output to read like a product flow document:

- grouped journey stories for `PUB`, `CUS`, `PRO`, and `ADM`
- screen-by-screen storyboard cards
- narrative labels that explain what the user is seeing
- collapsed technical notes only when needed
- case appendix for metadata, trace zip, and screenshot evidence

## Core Commands

### Generate seeded evidence

```bash
npm run test:e2e:frontend:evidence:seeded
```

This command still writes `allure-results`, but only as raw evidence input for the summary generator.
It also clears old summary output and leftover legacy report folders before the run starts.

### Generate the storyboard summary

```bash
npm run manual-qa:summary:generate:frontend
```

### Open the storyboard summary

```bash
npm run manual-qa:summary:open:frontend
```

### Run with traces

```bash
npm run test:e2e:frontend:trace
npm run test:e2e:frontend:trace:seeded
```

### Open the latest trace

```bash
npm run trace:show:frontend
npm run trace:show:frontend -- PRO-03
```

## Artifact Locations

- Playwright traces and other browser artifacts: `apps/frontend/test-results`
- Raw evidence results for summary generation: `apps/frontend/allure-results`
- Manual QA storyboard output: `apps/frontend/manual-qa-summary`

All of these directories are gitignored.

The legacy report directories `apps/frontend/allure-report` and `apps/frontend/playwright-report` are no longer part of the workflow and are actively cleared by the reset script.

## Recommended Usage By Goal

| Goal | Best tool in this repo |
| --- | --- |
| debug one failing or suspicious flow | Trace Viewer |
| read the seeded QA pack like a product document | Manual QA summary page |
| rerun deterministic browser coverage | Playwright seeded E2E |
