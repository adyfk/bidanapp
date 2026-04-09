# Deploy Artifacts

This folder contains V2 deployment-oriented examples only.

## Included

- `ecosystem.example.cjs`
  - PM2-style example process file for the multi-app V2 runtime

## Runtime surfaces

- backend
- bidan
- admin

## Start commands

Root-level helpers:

- `npm run start:backend`
- `npm run start:bidan`
- `npm run start:admin`

## Environment sources

Use the app-local env examples:

- `apps/backend/.env.example`
- `apps/bidan/.env.example`
- `apps/admin/.env.example`

Copy them to `.env` files per app before deploying or preparing a process manager config.
