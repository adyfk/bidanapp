FROM golang:1.26.0-alpine AS builder

WORKDIR /src

COPY apps/backend/go.mod apps/backend/go.sum ./apps/backend/
RUN cd apps/backend && go mod download

COPY apps/backend ./apps/backend
COPY apps/frontend/src/data/simulation ./apps/frontend/src/data/simulation

ARG OCI_CREATED=unknown
ARG OCI_REVISION=unknown
ARG OCI_SOURCE=unknown
ARG OCI_VERSION=dev

RUN cd apps/backend && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /tmp/bidanapp-api ./cmd/api

FROM alpine:3.22.2

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

COPY --from=builder /tmp/bidanapp-api /app/bidanapp-api
COPY --from=builder /src/apps/frontend/src/data/simulation /app/simulation

ENV APP_NAME=bidanapp-backend \
  APP_ENV=production \
  APP_VERSION=dev \
  HTTP_HOST=0.0.0.0 \
  HTTP_PORT=8080 \
  SIMULATION_DATA_DIR=/app/simulation

EXPOSE 8080

USER app

ENTRYPOINT ["/app/bidanapp-api"]
