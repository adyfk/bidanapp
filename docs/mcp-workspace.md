# MCP Workspace Setup

This repository now includes a workspace-level MCP setup aimed at browser-driven QA and implementation support.

## What Is Included

- `.vscode/mcp.json`
  Workspace MCP server definitions for:
  - `playwright-bidanapp`
  - `context7`
- `.vscode/tasks.json`
  Ready-to-run VS Code tasks for:
  - seeding backend data
  - starting backend and frontend
  - installing the Playwright browser
  - running seeded API smoke
  - running browser E2E
  - running browser E2E with traces
  - running seeded browser E2E with traces
  - running seeded browser E2E for storyboard evidence
  - opening the latest Playwright trace
  - running the combined MCP QA sweep

## Why These Servers

### `playwright-bidanapp`

Use this server for:

- real browser navigation and UI debugging
- reproducing route-level runtime crashes
- validating customer, professional, and admin flows
- capturing traces and sessions under `./.artifacts/mcp/playwright`

The workspace configuration intentionally enables:

- `chrome`
- `vision,devtools,pdf` capabilities
- isolated browser sessions
- trace and session saving
- larger viewport and longer navigation timeout for this monorepo

### `context7`

Use this server for:

- up-to-date package and framework documentation lookup
- implementation assistance while working on Next.js, Playwright, or related tooling

## First-Time Setup

From the repo root:

```bash
npm install
npm run mcp:playwright:install
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
npm run seed:backend
```

If PostgreSQL and Redis are not up yet:

```bash
npm run infra:up
```

## Recommended Workflow

### 1. Start the app stack

Either run the VS Code task `BidanApp: start app stack`, or run:

```bash
npm run dev:backend
npm run dev:frontend
```

Default URLs:

- frontend: `http://localhost:3000`
- backend docs: `http://localhost:8080/api/v1/docs`
- backend health: `http://localhost:8080/api/v1/health`

### 2. Use Playwright MCP against the local app

Once the workspace MCP server is active, point browser-driven work to:

- `http://localhost:3000/en/home`
- `http://localhost:3000/en/for-professionals`
- `http://localhost:3000/admin/login`

For production-like seeded verification, reset data first:

```bash
npm run seed:backend
```

## Validation Commands

### Browser E2E only

```bash
npm run test:e2e:frontend
```

### Browser E2E with Trace Viewer artifacts

```bash
npm run test:e2e:frontend:trace
npm run test:e2e:frontend:trace:seeded
npm run trace:show:frontend
npm run manual-qa:summary:open:frontend
```

Run a single seeded manual QA case and open its trace:

```bash
npm run test:e2e:frontend:trace:seeded -- --grep "CUS-02"
npm run trace:show:frontend -- CUS-02
npm run test:e2e:frontend:evidence:seeded -- --grep "CUS-02"
npm run manual-qa:summary:generate:frontend
```

### Seeded API smoke only

```bash
npm run smoke:seeded
```

### Combined MCP-oriented QA sweep

```bash
npm run mcp:qa
```

## Maintenance Notes

- Playwright MCP artifacts are written under `./.artifacts/mcp/playwright` and are gitignored.
- Local Playwright test traces are written under `apps/frontend/test-results` and are gitignored.
- Raw seeded evidence for the summary generator is written under `apps/frontend/allure-results`.
- The custom manual QA summary page is written under `apps/frontend/manual-qa-summary`.
- Keep `.vscode/mcp.json` focused on stable, shared workspace servers only.
- If the frontend or backend default URLs change, update this document and the VS Code tasks together.
- If a new team client does not read `.vscode/mcp.json`, copy the same server definitions into that client's MCP config.
