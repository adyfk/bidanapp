FROM node:24.12.0-alpine AS deps

WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/sdk/package.json ./packages/sdk/package.json
COPY scripts/ci/install-hooks.cjs ./scripts/ci/install-hooks.cjs

RUN npm ci

FROM node:24.12.0-alpine AS builder

WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
ARG NEXT_PUBLIC_APP_VERSION=dev
ARG NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED=false
ARG NEXT_PUBLIC_ADMIN_STUDIO_ENABLED=false
ARG NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=
ARG OCI_CREATED=unknown
ARG OCI_REVISION=unknown
ARG OCI_SOURCE=unknown
ARG OCI_VERSION=dev

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
  NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
  NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION \
  NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED=$NEXT_PUBLIC_ADMIN_CONSOLE_ENABLED \
  NEXT_PUBLIC_ADMIN_STUDIO_ENABLED=$NEXT_PUBLIC_ADMIN_STUDIO_ENABLED \
  NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=$NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY

RUN npm run build --workspace @bidanapp/frontend

FROM node:24.12.0-alpine AS runner

WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

ARG OCI_CREATED=unknown
ARG OCI_REVISION=unknown
ARG OCI_SOURCE=unknown
ARG OCI_VERSION=dev

LABEL org.opencontainers.image.created=$OCI_CREATED \
  org.opencontainers.image.revision=$OCI_REVISION \
  org.opencontainers.image.source=$OCI_SOURCE \
  org.opencontainers.image.version=$OCI_VERSION

ENV NODE_ENV=production \
  HOSTNAME=0.0.0.0 \
  PORT=3000

COPY --from=builder /repo/apps/frontend/public ./public
COPY --from=builder /repo/apps/frontend/.next/standalone ./
COPY --from=builder /repo/apps/frontend/.next/static ./apps/frontend/.next/static

USER app

EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]
