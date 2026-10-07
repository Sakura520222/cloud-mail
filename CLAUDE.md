# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cloud Mail is a self-hosted email service running entirely on Cloudflare (Workers + D1 + KV + R2). Monorepo with two pnpm packages, all plain JavaScript (no TypeScript):

- `mail-worker/` — backend: Hono web framework on Cloudflare Workers, Drizzle ORM over D1, email receiving via Cloudflare Email Workers, sending via Resend
- `mail-vue/` — frontend: Vue 3 + Element Plus + Pinia, built with Vite, served as static assets by the worker

Remotes: `origin` = the user's fork (Sakura520222/cloud-mail), `upstream` = maillab/cloud-mail.

## Critical Rules

- **Never commit or push without explicit permission.** Pushing to the `main` branch triggers the GitHub Actions workflow (`.github/workflows/deploy-cloudflare.yml`) which **deploys to Cloudflare automatically**. Deployment = push to remote.
- `pnpm test` inside `mail-worker` is **a deploy command**, not a test runner — it runs `wrangler deploy --config wrangler-test.toml` and pushes to Cloudflare. Do not run it casually.

## Commands

Backend (run inside `mail-worker/`):

```bash
pnpm install
pnpm dev        # wrangler dev (wrangler-dev.toml) on http://127.0.0.1:8787
pnpm deploy     # wrangler deploy (production config; prefer letting CI deploy)
```

Frontend (run inside `mail-vue/`):

```bash
pnpm install
pnpm dev        # vite dev server on port 3001, proxies API to http://127.0.0.1:8787/api
pnpm build      # vite build --mode release → outputs to ../mail-worker/dist
```

Full-stack local dev: start `pnpm dev` in `mail-worker` and `pnpm dev` in `mail-vue` simultaneously; the frontend dev server talks to the local worker.

Notes:
- There is no working test suite. `mail-worker/vitest.config.js` references a nonexistent `wrangler.jsonc` and `test/index.spec.js` is unused boilerplate ("Hello World worker").
- `wrangler.toml` (production template, bindings commented out), `wrangler-dev.toml` (local dev), `wrangler-test.toml` (test deploy), `wrangler-action.toml` (CI template with `${...}` placeholders). Binding names (`db`, `kv`, `r2`, `ai`, `assets`) must not be renamed.
- `wrangler.toml` `[build]` rebuilds the Vue app into `mail-worker/dist` on deploy; the worker serves it via the `assets` binding (`run_worker_first = true`, SPA fallback).

## Architecture

### Request flow (backend)

`mail-worker/src/index.js` is the worker entry:

1. `/api/*` → path stripped of `/api`, forwarded to the Hono app
2. `/static/`, `/attachments/` → objects served from KV (`kv-obj-service`)
3. everything else → static assets (the built Vue SPA)

Also exports: `email` (Cloudflare Email Worker handler for incoming mail) and `scheduled` (crons: every 30 min refresh analysis cache; daily job cleans verify records, resets send counts, completes receives, clears unbound OAuth users).

### Backend layering (mail-worker/src)

- `hono/hono.js` — shared Hono app instance + CORS + global error handler (maps `BizError` and unbound-binding errors to `{code, message}` JSON)
- `hono/webs.js` — imports security middleware and every `api/*-api.js` module; **API modules register their routes via side effects on the shared app**, so a new `*-api.js` file must be imported in `webs.js` to take effect
- `api/*-api.js` — thin route handlers: parse request, call service, wrap in `result.ok(data)` / `result.fail(message, code)`
- `service/*-service.js` — business logic; first parameter is the Hono context `c`, bindings accessed via `c.env` (or `{ env }` for non-request contexts like email/cron handlers)
- `entity/*.js` — Drizzle `sqliteTable` schemas; get a per-request ORM with `orm(c)` from `entity/orm.js` (`drizzle(c.env.db)`, SQL logging via `c.env.orm_log`)
- `dao/` — only analysis/report queries; most queries live inline in services
- `error/biz-error.js` — `BizError(message, code)`; throw this for all business errors (message may be an i18n key)
- `model/result.js` — the `{code: 200, message, data}` response envelope used by every endpoint

### Auth & RBAC (mail-worker/src/security/security.js)

A single global middleware:

- `exclude` list — public paths, no auth
- `/public/*` — authenticated by a public API token stored in KV
- everything else — JWT from the `Authorization` header, verified then matched against per-user auth info cached in KV; `c.set('user', ...)` for downstream handlers
- `requirePerms` + `premKey` — route paths requiring a permission, and the mapping from permission keys (e.g. `user:delete`) to route paths. The admin account (`c.env.admin`) bypasses permission checks. **When adding a protected endpoint, add its path to both lists.**

### Database migrations (mail-worker/src/init/init.js)

No migration tool — versioned functions (`v1_1DB` … `v3_3DB`) run raw `ALTER TABLE`/`CREATE` SQL, each tolerant of already-applied changes (errors are swallowed with a warning). New schema changes = add a new version function and call it from `init()`. Runs via `GET /api/init/:jwt_secret` after each deploy (CI calls it automatically).

### i18n (both sides)

Backend: i18next, dictionaries in `mail-worker/src/i18n/zh.js` / `en.js`, language from the `accept-language` header, fallback `zh`. Frontend: vue-i18n, dictionaries in `mail-vue/src/i18n/zh.js` / `en.js`. **User-facing strings must use i18n keys and be added to both zh and en on both sides** — hardcoded Chinese/English strings have been actively removed (see git history).

### Frontend structure (mail-vue/src)

- Element Plus is **auto-imported** (unplugin-auto-import + unplugin-vue-components) — no manual component imports
- `axios/index.js` — single axios instance; response interceptor unwraps `data.data`, handles 401 (clear token → redirect `/login`), 403, and error toasts. Requests carry the token in `Authorization` and language in `accept-language`
- `request/*` — API modules mirroring backend endpoints
- `store/*` — Pinia stores (persisted); `router/index.js` defines routes whose `meta.menu` drives the sidebar, `perm/perm.js` filters menu/routes by the user's permissions
- `views/*` — one directory per page/feature; `layout/` holds the app shell; `components/email-scroll` is the main email list component
- `@` alias → `src/`; env modes: `dev` (local worker), `remote` (skymail.ink demo), `release` (build into worker dist)

## Deployment

GitHub Actions on push to `main` (paths `mail-worker/**`, `mail-vue/**`): installs deps, fills `wrangler-action.toml` from repo vars/secrets (creating D1/KV if missing), deploys with wrangler, then calls `/api/init/:jwt_secret` to run migrations. Config lives in repo variables/secrets (`DOMAIN`, `ADMIN`, `JWT_SECRET`, `CLOUDFLARE_API_TOKEN`, …) — see the workflow file and `doc/github-action.md`.

## CodeGraph

The repo is indexed by CodeGraph (`.codegraph/`, git-ignored). For understanding or locating code, prefer one `codegraph_explore` call (MCP tool, passing this repo as `projectPath`; or shell `codegraph explore "..."`) over grep/Read loops — it returns the verbatim source of the relevant symbols plus the call paths between them (e.g. tracing how an incoming email flows from the Cloudflare email handler through services).

## Conventions

- Backend code uses tabs, frontend uses 4 spaces; plain `.js` everywhere (jsconfig/ESM, no TS)
- Files are kebab-case with a layer suffix: `*-api.js`, `*-service.js`, `*-utils.js`, `*-const.js`
- Commit style: conventional commits (`feat:`, `fix:`, `chore:`, optionally scoped, in English)
- `.sakura/` holds docs/plans/memory for a separate AI workflow (SAKURA.md project overview) — leave it intact; it is committed to the repo
- The project is bilingual (Chinese-first README, English README-en); error messages are often written as `中文 english` pairs in backend constants
