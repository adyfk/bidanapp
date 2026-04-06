# Playwright Trace Viewer Guide

This guide explains how to run BidanApp browser E2E with Playwright traces and how to inspect the resulting artifacts in Trace Viewer.

If you need the companion storyboard workflow, see [QA Visual Reporting](./qa-visual-reporting.md).

Use this guide when you want:

- a fast `lightweight` trace pass for route and hydration issues
- a `seeded` trace pass for the full QA matrix
- a single trace per manual QA case such as `PUB-01` or `PRO-03`

The manual QA case pack is encoded directly in [apps/frontend/tests/e2e/runtime-smoke.spec.mjs](../apps/frontend/tests/e2e/runtime-smoke.spec.mjs). Each case now has its own Playwright test title prefixed with `[manual-qa]`.

## 1. First-Time Setup

```bash
npm install
npm run mcp:playwright:install
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
```

If you want the full seeded QA pack, reset the canonical backend seed first:

```bash
npm run qa:manual:setup
```

## 2. Run E2E With Traces

### Default lightweight pass

Use this when you want the fastest route-level trace without the full seeded dataset:

```bash
npm run test:e2e:frontend:trace
```

### Full seeded pass for all manual QA cases

Use this when you want end-to-end coverage for the restored QA matrix:

```bash
npm run test:e2e:frontend:trace:seeded
```

### Single-case trace

Use Playwright grep to isolate one case ID:

```bash
npm run test:e2e:frontend:trace:seeded -- --grep "PUB-01"
npm run test:e2e:frontend:trace:seeded -- --grep "CUS-02"
npm run test:e2e:frontend:trace:seeded -- --grep "PRO-03"
npm run test:e2e:frontend:trace:seeded -- --grep "ADM-04"
```

## 3. Open The Trace Viewer

Open the newest available trace:

```bash
npm run trace:show:frontend
```

Open the newest trace that matches a case ID or keyword:

```bash
npm run trace:show:frontend -- PRO-03
npm run trace:show:frontend -- ADM-02
```

Open an explicit trace archive:

```bash
npm run trace:show:frontend -- apps/frontend/test-results/<test-folder>/trace.zip
```

## 4. Artifact Layout

Playwright writes browser artifacts under:

- `apps/frontend/test-results`

Important notes:

- every fresh Playwright run rewrites the current `test-results` tree
- `trace.zip` is the file opened by Trace Viewer
- the repo ignores these artifacts in git

## 5. Which Mode To Use

| Need | Command |
| --- | --- |
| quick runtime smoke with traces | `npm run test:e2e:frontend:trace` |
| full end-to-end QA matrix with traces | `npm run test:e2e:frontend:trace:seeded` |
| one seeded manual QA case | `npm run test:e2e:frontend:trace:seeded -- --grep "<CASE-ID>"` |
| open the newest trace | `npm run trace:show:frontend` |
| open the newest trace for one case | `npm run trace:show:frontend -- <CASE-ID>` |

## 6. Manual QA Case Map

Run the case pack below with `npm run test:e2e:frontend:trace:seeded`.

| Case | Grep | Focus |
| --- | --- | --- |
| `PUB-01` | `PUB-01` | locale switch and onboarding entry |
| `PUB-02` | `PUB-02` | public discovery surfaces |
| `PUB-03` | `PUB-03` | published professional detail |
| `PUB-04` | `PUB-04` | service-first discovery routing |
| `CUS-01` | `CUS-01` | active lifecycle and seeded chat |
| `CUS-02` | `CUS-02` | unread notifications and requested state |
| `CUS-03` | `CUS-03` | history and resolved journeys |
| `PRO-01` | `PRO-01` | published professional portal |
| `PRO-02` | `PRO-02` | submitted review gate |
| `PRO-03` | `PRO-03` | changes-requested revision flow |
| `PRO-04` | `PRO-04` | verified pre-publish state |
| `PRO-05` | `PRO-05` | draft onboarding gaps |
| `PRO-06` | `PRO-06` | ready-for-review warning path |
| `ADM-01` | `ADM-01` | support desk triage |
| `ADM-02` | `ADM-02` | professional review operations |
| `ADM-03` | `ADM-03` | operational booking context |
| `ADM-04` | `ADM-04` | catalog and studio edits |

## 7. Recommended Debug Flow

1. Reset the seed with `npm run qa:manual:setup` when you need deterministic state.
2. Run `npm run test:e2e:frontend:trace:seeded -- --grep "<CASE-ID>"`.
3. Open the trace with `npm run trace:show:frontend -- <CASE-ID>`.
4. Inspect the action list, DOM snapshots, console, network waterfall, and assertion step where the failure happened.
5. Re-run the same case after the fix before expanding back to the full seeded pack.
