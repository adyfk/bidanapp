---
"@bidanapp/release": minor
---

Move the app to backend-owned runtime state and production-style deployment flows.

This rollout replaces legacy frontend mock ownership with backend persistence for auth,
viewer and admin state, professional portal resources, public read-model content, and chat history.
It also adds deploy env validation, automated Atlas migrations during compose rollout,
seeded and post-deploy smoke paths, and a full maintenance-oriented system flow diagram pack.
