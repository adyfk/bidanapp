# Development Workflow

This document defines the expected engineering workflow for day-to-day changes, PR governance, release behavior, and local validation.

## 1. Workflow Principles

The repository follows these principles:

- issue-first work tracking
- branch naming discipline
- Conventional Commit based PR titles
- squash-only merge to `main`
- Changesets for release-worthy change tracking
- local preflight checks as the default gate

The repository intentionally stays CI-agnostic. If you attach GitHub, GitLab, Buildkite, or another CI later, it should run the same local commands documented here.

## 2. Issue-First Workflow

Every meaningful change should be tracked by an issue before the branch is created.

The issue should define at least:

- problem or goal
- acceptance criteria
- scope
- technical notes when relevant

## 3. Branch Naming

Required branch format:

```text
<type>/<issue-number>-<slug>
```

Examples:

- `feat/128-chat-persistence`
- `fix/212-invalid-slug-sanitization`
- `chore/301-docs-refresh`

Branch names are checked by `npm run branch:lint`.

## 4. Commit Authoring

The repository uses:

- `lefthook` for local git hooks
- `commitlint` for commit message validation
- `@commitlint/prompt-cli` as the local commit authoring helper behind `npm run commit`

Useful command:

```bash
npm run commit
```

Current local hooks:

- `pre-commit`
  Runs Biome on staged code, JSON, and Markdown files.
- `commit-msg`
  Runs commitlint against the final commit message.

Important nuance:

- commit messages are validated locally
- PR titles should still follow Conventional Commits
- if your Git host supports squash-only merge, the PR title remains the most important message for release semantics

## 5. PR Title Rules

PR titles must follow Conventional Commits.

Examples:

- `feat(api): add backend integration diagnostics`
- `fix(chat): sanitize websocket error handling`
- `feat(api)!: replace simulation appointments contract`

Allowed types currently include:

- `build`
- `chore`
- `ci`
- `docs`
- `feat`
- `fix`
- `ops`
- `perf`
- `refactor`
- `release`
- `revert`
- `style`
- `test`

The PR title gate runs through:

```bash
npm run pr:title:lint
```

## 6. PR Body Rules

Every PR body must include an issue reference:

- `Closes #123`
- `Refs #123`

The PR body gate runs through:

```bash
npm run pr:body:lint
```

## 7. Changeset Rules

Changesets are required for release-worthy changes.

Add one with:

```bash
npm run changeset
```

The changeset gate is driven by PR title semantics:

- `feat` requires a changeset
- `fix` requires a changeset
- `perf` requires a changeset
- `revert` requires a changeset
- any breaking change requires a changeset

These types usually do not require a changeset unless they are breaking:

- `docs`
- `test`
- `chore`
- `ci`
- `build`
- `ops`
- `refactor`

The release manifest package is:

- `@bidanapp/release`

This workspace exists to give Changesets one product-level version track without pretending that frontend, backend, and SDK are independently versioned products.

## 8. Release Semantics

Semantic release behavior is determined from changesets and commit semantics:

- `feat:` -> minor
- `fix:` -> patch
- `perf:` -> patch
- `revert:` -> patch
- `!` or `BREAKING CHANGE:` -> major
- non-release types -> no release unless breaking

Operationally:

- the released product identifier is the git tag `vX.Y.Z`
- `packages/release/package.json` stores the version being prepared by Changesets
- frontend and backend runtime versions are injected by CI and deployment metadata

## 9. Local Validation Commands

Before opening a PR, the safest full validation is:

```bash
npm run ci:check
```

That includes:

- contract generation
- generated-file drift check
- lint
- typecheck
- test
- build

Useful narrower commands:

```bash
npm run branch:lint
npm run pr:title:lint
npm run pr:body:lint
npm run changeset:check
npm run release:dry-run
```

If you want Codex to choose the minimum required checks for you, use the repo-local skill at `.codex/skills/bidanapp-preflight`.

## 10. Recommended Day-To-Day Flow

1. create or confirm the issue
2. create a branch that passes branch lint
3. implement the change in the right layer
4. run local checks
5. add a changeset if needed
6. open a PR with a valid title and issue reference
7. merge with squash only

## 11. Release And Deploy Notes

- Changesets remain the release manifest source for this repo.
- `packages/release/package.json` is still the working manifest that records the next product version.
- `vX.Y.Z`, `APP_VERSION`, `NEXT_PUBLIC_APP_VERSION`, and image metadata remain the deploy-facing version identity.
- Actual tagging, publishing, and CI execution are intentionally not locked to a specific Git platform anymore.

## 12. Common Mistakes To Avoid

- opening a release-worthy PR without a changeset
- using a vague PR title that does not follow Conventional Commits
- skipping issue linkage in the PR body
- pushing directly to `main`
- treating app `package.json` versions as the release source of truth
- assuming a pre-commit hook is enough when `npm run ci:check` has not been run
