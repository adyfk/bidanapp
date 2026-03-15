---
name: bidanapp-preflight
description: Use when preparing a commit, PR, or release-related change in the BidanApp repository. Runs the minimum required local checks, enforces branch and PR conventions, verifies changeset requirements, and summarizes release impact without relying on a self-hosted Git platform.
---

# BidanApp Preflight

Use this skill when the user asks to:

- prepare a commit
- verify a branch or PR is safe
- check if a changeset is required
- validate release impact
- run the minimum checks before merge

## Workflow

1. Read the diff and classify the change:
   - docs-only
   - frontend only
   - backend only
   - contract-affecting
   - release-worthy (`feat`, `fix`, `perf`, `revert`, or breaking)
2. Run the minimum relevant checks:
   - always consider `npm run branch:lint`
   - always consider `npm run pr:title:lint`
   - always consider `npm run pr:body:lint`
   - run `npm run changeset:check` when the change is release-worthy
   - run `npm run contract:generate` when backend contract or SDK output may change
   - run `npm run ci:check` when the change is broad, risky, or cross-layer
3. Summarize:
   - what was run
   - what passed or failed
   - whether a changeset is required
   - whether the change is safe to commit or open as a PR

## Rules

- Prefer the smallest sufficient check set, not `npm run ci:check` by reflex.
- If backend responses, routes, or OpenAPI artifacts change, verify generated output.
- If the change is docs-only or comment-only, avoid heavy checks unless the user asks.
- If a required check cannot run, state that explicitly and explain the gap.
- Treat `packages/release/package.json` as the working release manifest, not the deployed version identity.

## Check Selection

### Docs-only or copy-only

- `npm run branch:lint`
- `npm run pr:title:lint`
- `npm run pr:body:lint`

### Frontend-only UI change

- `npm run branch:lint`
- `npm run pr:title:lint`
- `npm run pr:body:lint`
- targeted frontend checks if available
- `npm run ci:check` if the change is broad or risky

### Backend or contract change

- `npm run branch:lint`
- `npm run pr:title:lint`
- `npm run pr:body:lint`
- `npm run contract:generate`
- `npm run generated:check`
- `npm run ci:check`

### Release-worthy change

- all relevant checks above
- `npm run changeset:check`
- `npm run release:dry-run` when the user asks for release confidence

## Output

Keep the summary short and operational:

- change classification
- commands run
- pass/fail status
- changeset required: yes/no
- ready to commit or not ready
