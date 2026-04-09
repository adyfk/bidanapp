# Development Workflow

## Tujuan

Dokumen ini mendefinisikan workflow engineering harian untuk perubahan repo, PR governance, release semantics, dan validation commands.

## Workflow Principles

- issue-first tracking
- branch naming discipline
- commit dan PR titles memakai release prefix yang valid
- squash-only merge ke `main`
- Changesets untuk release-worthy work
- local preflight checks sebagai default gate

Repo ini tetap CI-agnostic. Kalau nanti dihubungkan ke GitHub, GitLab, Buildkite, atau platform lain, workflow yang dijalankan harus tetap mengikuti command lokal yang sama.

## Branch Naming

Format:

```text
<type>/<issue-number>-<slug>
```

Contoh:

- `feat/128-bidan-payment-hardening`
- `fix/212-session-cookie-domain`
- `chore/301-docs-refresh`

Check dengan:

```bash
npm run branch:lint
```

## Commit And PR Titles

Allowed prefixes:

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

Contoh PR title yang valid:

- `feat(auth): add seeded session device management`
- `fix(admin): prevent duplicate session ids on login`
- `docs: refresh Bidan handbook`

Checks:

```bash
npm run pr:title:lint
npm run pr:body:lint
```

## Changesets

Tambahkan changeset untuk perubahan yang release-worthy:

```bash
npm run changeset
```

Biasanya wajib untuk:

- `feat`
- `fix`
- `perf`
- `revert`
- breaking changes

Package release manifest tetap:

- `@marketplace/release`

## Local Validation

Full check:

```bash
npm run ci:check
```

Isi check ini:

- contract generation
- generated-file drift check
- boundary guard
- UI guard
- lint
- typecheck
- test
- build

Command yang sering dipakai:

```bash
npm run boundary:check
npm run ui:guard
npm run lint
npm run typecheck
npm run test
npm run build
npm run dev:smoke
npm run e2e:smoke
npm run e2e:journey
npm run journey:open
```

## Critical Flow Rule

Untuk flow yang dianggap critical, perubahan belum dianggap selesai bila hanya punya assertion teknis.

Minimum artefak yang harus ada:

1. smoke assertion bila relevan
2. E2E spec
3. journey capture
4. handbook link di `docs/journeys/`

## Recommended Flow

1. buat atau konfirmasi issue
2. buat branch yang lolos branch lint
3. implement perubahan
4. jalankan local validation yang sesuai
5. tambahkan changeset bila perlu
6. buka PR dengan title dan issue reference yang valid
7. merge dengan squash only

## Common Mistakes

- membuka PR release-worthy tanpa changeset
- memakai commit/PR title tanpa prefix valid
- lupa issue reference di PR body
- push langsung ke `main`
- mengandalkan pre-commit hook tanpa menjalankan validation yang cukup
