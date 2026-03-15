# Development Workflow

This document defines the expected engineering workflow for day-to-day changes, PR governance, release behavior, and CI/CD alignment.

## 1. Workflow Principles

The repository follows these principles:

- issue-first work tracking
- branch naming discipline
- Conventional Commit based PR titles
- squash-only merge to `main`
- Changesets for release-worthy change tracking
- server-side checks in Forgejo as the real gate

Local tooling helps, but merge safety depends on the repository checks, not on developer habit alone.

## 2. Issue-First Workflow

Every meaningful change should be tracked by an issue before the branch is created.

Issue templates already exist for:

- features
- bugs

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

Branch names are checked by `npm run branch:lint` and by the Forgejo `branch-name-check` job.

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
- PR title is also validated server-side
- because the merge strategy is squash-only, the PR title is the most important message for release semantics

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

and the Forgejo `pr-title-lint` job.

## 6. PR Body Rules

Every PR body must include an issue reference:

- `Closes #123`
- `Refs #123`

The PR template already includes fields for:

- issue reference
- scope
- risk level
- changes
- release notes
- test evidence
- rollout notes

The PR body gate runs through:

```bash
npm run pr:body:lint
```

and the Forgejo `issue-link-check` job.

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

## 10. Forgejo Checks

The intended required checks on `main` are:

- `branch-name-check`
- `changeset-check`
- `pr-title-lint`
- `issue-link-check`
- `ci-check`

These are defined through workflows in `.forgejo/workflows`.

Repository admins still need to enforce branch protection and squash-only merge settings manually in Forgejo.

## 11. Release And Deploy Flow

After a PR merges into `main`:

1. CI runs on `main`
2. release job runs Changesets release automation
3. the release job commits the release manifest and changelog update
4. the release job creates tag `vX.Y.Z`
5. the release job publishes a Forgejo release record
6. staging deploy builds images and rolls out automatically
7. production deploy is manual through workflow dispatch with an explicit release tag

GitHub is treated as a mirror, not the main source of issue, PR, or board truth.

## 12. Recommended Day-To-Day Flow

1. create or confirm the issue
2. create a branch that passes branch lint
3. implement the change in the right layer
4. run local checks
5. add a changeset if needed
6. open a PR with a valid title and issue reference
7. merge with squash only

## 13. Common Mistakes To Avoid

- opening a release-worthy PR without a changeset
- using a vague PR title that does not follow Conventional Commits
- skipping issue linkage in the PR body
- pushing directly to `main`
- treating app `package.json` versions as the release source of truth
- forgetting that server-side checks, not local hooks, are the actual governance gate
