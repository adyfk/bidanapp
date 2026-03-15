# Simulation Data Contract

This app now uses domain-split simulation files instead of one giant fixture:

- `src/data/simulation/settings.json`
- `src/data/simulation/catalog.json`
- `src/data/simulation/appointments.json`
- `src/data/simulation/chat.json`
- `src/data/simulation/ui.json`

The adapter layer is also split by domain:

- `src/lib/simulation/catalog.ts`
- `src/lib/simulation/appointments.ts`
- `src/lib/simulation/chat.ts`
- `src/lib/simulation/ui.ts`
- `src/lib/constants.ts` only re-exports for compatibility

## Backend-Mappable Sections

These simulation domains are safe to replace with backend/API responses later because they describe business data or demo payloads:

- Settings: `branding`, `terms`, `colors`
- Catalog: `categories`, `services`, `professionals`
- Appointments: `appointments`
- Chat: `directThreads`, `appointmentThreads`
- UI presets: `currentUsers`, `sharedContexts`, `homeScenarios`, `mediaPresets`, `professionalDetailScenarios`, `messagePresets`

Key CMS-ready fields now included across collections:

- `index` for explicit ordering
- `image`, `iconImage`, `coverImage` for visual assets
- `shortLabel`, `shortDescription`, `badge`, `badgeLabel` for compact UI text
- `overviewPoints`, `highlights`, `specialties`, `languages`, `addressLines` for richer content blocks
- `availabilityLabel`, `responseTime` for list/detail UI states
- Professional profiles now also carry `portfolioStats`, `credentials`, `activityStories`, `portfolioEntries`, `gallery`, `testimonials`, `feedbackSummary`, `feedbackMetrics`, `feedbackBreakdown`, and `recentActivities`

## Preserved UI Contract

The current React screens still consume the same hydrated shapes as before:

- `MOCK_CATEGORIES: Category[]`
- `MOCK_SERVICES: GlobalService[]`
- `MOCK_PROFESSIONALS: Professional[]`
- `MOCK_APPOINTMENTS: Appointment[]`

Additional scenario exports now exist for UI development:

- `SIMULATION_HOME_SCENARIOS`
- `SIMULATION_CURRENT_USERS`
- `SIMULATION_SHARED_CONTEXTS`
- `SIMULATION_MEDIA_PRESETS`
- `SIMULATION_MESSAGE_PRESETS`
- `SIMULATION_PROFESSIONAL_DETAIL_SCENARIOS`
- `APPOINTMENTS_BY_STATUS`
- `SERVICES_WITHOUT_PROVIDERS`

Compatibility rules:

- `appointments` in JSON are normalized with `professionalId` and `serviceId`
- `MOCK_APPOINTMENTS` in TypeScript are hydrated back into nested `{ professional, service }`
- Home/UI presets are stored as scenario ids and hydrated into ready-to-render objects

That means you can move the raw JSON to an API later without rewriting the current screen contract first.

## Where Frontend Config Still Lives

These files are still frontend-owned even though most content now comes from JSON:

- `src/lib/config.ts`
  Thin adapter that reads `src/data/simulation/settings.json`
- `messages/en.json`
- `messages/id.json`
  Translation strings

## Suggested Backend Endpoints

If you later replace the JSON with APIs, this is the cleanest split:

- `GET /me` -> selected current user profile
- `GET /settings` -> branding, terms, colors
- `GET /categories` -> `categories`
- `GET /services` -> `services`
- `GET /professionals` -> `professionals`
- `GET /appointments` -> normalized `appointments`
- `GET /appointments/:id/chat` -> appointment-specific chat thread
- `GET /professionals/:slug/chat` -> direct chat thread
- `GET /home` -> hydrated home scenario or a backend equivalent
- `GET /simulation/presets` -> optional UI-development-only preset metadata

## Current Limitation

`messagePresets` and some `mediaPresets` are still UI-facing demo content. They are now split into scenario collections so the app can exercise more states during UI development without overloading one file or one type module.
