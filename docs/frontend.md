# Frontend Guide

This guide explains how the frontend is structured, how routing and locale handling work, where data comes from, and how to add features without collapsing screen logic back into large monolith components.

## 1. Frontend Stack

The frontend app lives in `apps/frontend` and uses:

- Next.js `16.1.6`
- React `19.2.4`
- `next-intl` for localization
- Tailwind CSS `4`
- Biome for formatting and linting
- Node test runner for smoke tests

## 2. Directory Structure

The important frontend directories are:

```text
apps/frontend/src
├── app                        # App Router entrypoints
├── components
│   ├── layout                 # layout-level components such as bottom navigation
│   ├── screens                # page-sized screen containers
│   ├── providers              # React providers when needed
│   └── ui                     # shared presentational primitives
├── features
│   ├── appointments
│   ├── backend-integration
│   ├── professional-detail
│   └── service-detail
├── i18n                       # next-intl locale routing and request helpers
├── lib                        # config, env, routes, backend adapters, shell/read-model helpers
├── messages                   # localized message catalogs
└── types                      # TypeScript app-specific types
```

## 3. Route Structure

The frontend uses localized routes under `src/app/[locale]`.

Current route files include:

- `src/app/[locale]/page.tsx`
- `src/app/[locale]/home/page.tsx`
- `src/app/[locale]/explore/page.tsx`
- `src/app/[locale]/services/page.tsx`
- `src/app/[locale]/appointments/page.tsx`
- `src/app/[locale]/appointments/[id]/page.tsx`
- `src/app/[locale]/activity/[id]/page.tsx`
- `src/app/[locale]/p/[slug]/page.tsx`
- `src/app/[locale]/s/[slug]/page.tsx`
- `src/app/[locale]/profile/page.tsx`

Global metadata routes also exist:

- `src/app/robots.ts`
- `src/app/sitemap.ts`

## 4. Locale And Navigation Rules

Locale routing is defined in `src/i18n/routing.ts`.

Current locale setup:

- supported locales: `id`, `en`
- default locale: `id`

Important rules:

- use `@/i18n/routing` as the source of truth for locale-aware navigation primitives
- use route helpers from `@/lib/routes.ts` for app paths, slug routes, and query-based routes
- do not hardcode localized route strings in unrelated components
- if you add a new route, ensure it works for both `/id/*` and `/en/*`

The smoke test in `apps/frontend/tests/route-smoke.test.mjs` explicitly checks both locales and invalid slugs.

## 5. Screen Composition Pattern

The expected structure for non-trivial UI is:

```text
route file
  -> screen container
  -> feature sections
  -> feature hooks or action handlers
  -> shared UI primitives
```

Examples already in the repository:

- appointments flow split into screen, feature components, and `useAppointmentFlow`
- professional detail split into screen, feature sections, and `useProfessionalDetail`
- service detail split into screen, feature sections, and `useServiceDetail`

Why this matters:

- route files stay thin
- screen containers handle page composition
- hooks manage derived state and actions
- section components stay reusable and testable
- placeholder `alert()` flows are avoided in favor of visible UI state

## 6. Shared UI Boundaries

Use these layers consistently:

- `components/screens/*`
  Page-scale composition only.
- `features/*/components/*`
  Domain or feature sections.
- `features/*/hooks/*`
  State, side effects, and action handling for one feature.
- `components/ui/*`
  Reusable design primitives shared across screens.
- `components/layout/*`
  Cross-page structural components such as navigation.

If a component becomes page-aware, it probably belongs in `components/screens` or `features/*`, not in `components/ui`.

## 7. Data Sources In The Frontend

The frontend is backend-first.

Runtime data should go through:

- `@bidanapp/sdk` for typed transport
- `src/lib/backend.ts` for frontend runtime URL helpers
- SDK adapters in `packages/sdk/src/adapters/*`
- frontend composition helpers such as `src/lib/public-bootstrap.ts`, `src/lib/use-app-shell.ts`, and `src/lib/use-catalog-read-model.ts`

Backend-owned seed data now lives under `apps/backend/seeddata`.
Frontend app code should not import seed JSON directly. Direct seed reads are limited to backend bootstrap/import paths and contract-oriented tests.

## 8. Runtime Configuration

Frontend public env values are loaded in `src/lib/env.ts` and composed with code-level app config in `src/lib/config.ts`.

Important runtime values:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_APP_VERSION`

`APP_CONFIG` combines:

- branding and theme constants from code
- deployment-specific public env values

This split is important:

- env controls environment-specific values
- code constants control product defaults that are not domain data

## 9. Styling And UI Notes

Current styling conventions:

- shared visual values come from `APP_CONFIG.colors`
- route-level layout is applied in `src/app/[locale]/layout.tsx`
- the app shell uses a mobile-app inspired layout with bottom navigation
- design primitives should be kept reusable, not page-coupled

When editing UI:

- preserve the current visual direction
- avoid introducing route-specific layout hacks into shared primitives
- keep accessibility warnings clean under Biome where practical

## 10. Testing Strategy

Frontend testing is intentionally lightweight but targeted:

- smoke and route integration coverage via `apps/frontend/tests/route-smoke.test.mjs`
- both locales `id` and `en` are verified
- invalid slugs must return `404`

Useful commands:

```bash
npm run test --workspace @bidanapp/frontend
npm run typecheck --workspace @bidanapp/frontend
npm run lint --workspace @bidanapp/frontend
```

The smoke test runs a real Next.js dev server, so it is slower than a pure unit test. That tradeoff is intentional for route confidence.

## 11. Adding A New Frontend Feature

Recommended checklist:

1. Decide which backend contract or read-model surface owns the feature data.
2. Add or update route files under `src/app/[locale]` as needed.
3. Create or update a screen container in `components/screens`.
4. Split complex sections into `features/<feature>/components`.
5. Put state or action logic into `features/<feature>/hooks`.
6. Use `@/i18n/routing` and `@/lib/routes.ts` for navigation.
7. If the feature consumes backend data, use `@bidanapp/sdk`.
8. If the feature changes route coverage, update or extend the smoke test.
9. If the feature needs new backend data, add the route or adapter first instead of reviving frontend seed hydration.

## 12. Common Mistakes To Avoid

- hardcoding links instead of using routing helpers
- coupling a screen directly to raw backend transport data when an adapter is needed
- putting page-specific logic into shared UI primitives
- reintroducing monolithic screen components when sections and hooks are more appropriate
- forgetting to validate both `/id/*` and `/en/*`
- reading seed JSON directly from frontend runtime code instead of going through backend-owned contracts
