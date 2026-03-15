SHELL := /bin/sh

.PHONY: bootstrap dev build lint test typecheck check clean doctor infra-up infra-down

bootstrap:
	npm install

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

test:
	npm run test

typecheck:
	npm run typecheck

check:
	npm run check

doctor:
	npm run doctor

infra-up:
	docker compose -f docker-compose.dev.yml up -d

infra-down:
	docker compose -f docker-compose.dev.yml down

clean:
	npm run clean
