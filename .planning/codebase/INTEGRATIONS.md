# External Integrations

**Analysis Date:** 2026-04-15

## APIs & External Services

**Authentication:**
- Better Auth - Session and auth API provider for the website.
  - SDK/Client: `better-auth` and `better-auth/react` in `packages/website/src/utils/auth.ts` and `packages/website/src/lib/auth-client.ts`
  - Auth: `BETTER_AUTH_SECRET` in `packages/website/src/config/privateEnv.ts`
- Google OAuth - Social sign-in provider wired through Better Auth.
  - SDK/Client: Better Auth Google provider config in `packages/website/src/utils/auth.ts`
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in `packages/website/src/config/privateEnv.ts`

**Database-backed website API:**
- Website internal API - TanStack Router server handlers expose auth/session/game persistence endpoints in `packages/website/src/routes/api/auth/$.ts`, `packages/website/src/routes/api/session/validate.ts`, and `packages/website/src/routes/api/game/*.ts`.
  - SDK/Client: Native `fetch` from `packages/game-server/src/**/*` and Better Auth handler routing in `packages/website/src/routes/api/auth/$.ts`
  - Auth: `GAME_SERVER_API_KEY` via `X-API-Key` in `packages/website/src/utils/game-server-api-auth.ts`

**Realtime networking:**
- WebSocket game transport - Game clients connect to the game server through either Socket.IO or uWebSockets, selected in `packages/game-shared/src/config/network.ts`.
  - SDK/Client: `socket.io-client` in `packages/game-client/src/network/socketio-client-adapter.ts`; `socket.io` and `uwebsockets.js` in `packages/game-server/src/network/*`
  - Auth: Short-lived HMAC game auth token signed in `packages/website/src/fn/game-auth.ts` and validated in `packages/game-server/src/services/session-validator.ts` using `GAME_SERVER_API_KEY`

**Editor tooling service:**
- Biome editor HTTP API - Separate Express service for authoring biome and world-map files in `packages/biome-editor-server/src/server.ts`, consumed by the website editor UI through `packages/website/src/routes/editor/-config/api.ts` and `packages/website/src/routes/editor/-hooks/useEditorApi.ts`.
  - SDK/Client: Native `fetch`
  - Auth: No request authentication detected; CORS is open in `packages/biome-editor-server/src/server.ts`

**Payments:**
- Stripe CLI forwarding - Dev script exists in `packages/website/package.json` (`stripe listen --forward-to localhost:3000/api/stripe/webhook`).
  - SDK/Client: Stripe CLI script only
  - Auth: Not detected in source files read
  - Implementation status: Webhook route `/api/stripe/webhook` was not detected under `packages/website/src/routes/`

**File storage:**
- Cloud object storage - Not detected in current source files read. No S3/R2 client imports or presigned upload handlers were found under `packages/website/src/**/*`.

## Data Storage

**Databases:**
- PostgreSQL
  - Connection: `DATABASE_URL` in `packages/website/src/config/privateEnv.ts`
  - Client: `pg` + `drizzle-orm` in `packages/website/src/db/index.ts`
  - Schema: Defined in `packages/website/src/db/schema.ts`
  - Local dev provisioning: Docker Compose in `packages/website/docker-compose.yml`

**File Storage:**
- Local filesystem for authored game content in `packages/biome-editor-server/src/util/world-map-file-handler.ts` and `packages/biome-editor-server/src/util/biome-file-handler.ts`.
- Cloud file storage integration: Not detected in current source.

**Caching:**
- None detected as a dedicated external cache. TanStack Query client-side caching is used in `packages/website/src/routes/editor/-hooks/useEditorApi.ts`, but no Redis/Memcached service is configured.

## Authentication & Identity

**Auth Provider:**
- Better Auth
  - Implementation: Server config in `packages/website/src/utils/auth.ts`, browser client in `packages/website/src/lib/auth-client.ts`, auth route handler in `packages/website/src/routes/api/auth/$.ts`, and session validation endpoint in `packages/website/src/routes/api/session/validate.ts`
- Google OAuth
  - Implementation: Social provider configuration in `packages/website/src/utils/auth.ts`; UI triggers exist in `packages/website/src/routes/sign-in.tsx` and `packages/website/src/routes/sign-up.tsx`
- Game socket identity
  - Implementation: Website issues short-lived HMAC tokens in `packages/website/src/fn/game-auth.ts`; game server validates locally in `packages/game-server/src/services/session-validator.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, Bugsnag, Rollbar, or equivalent integration was found in the files read.

**Logs:**
- Native console logging is used across services, including auth/session errors in `packages/website/src/routes/api/session/validate.ts`, request logs in `packages/biome-editor-server/src/middleware/request-log.ts`, and operational logs in `packages/game-server/src/managers/server-socket-manager.ts` and `packages/biome-editor-server/src/util/notify-game-server-map-reload.ts`.

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured. Runtime start commands indicate self-hosted Node services: website Nitro server in `packages/website/package.json`, game server bundle in `packages/game-server/tsup.config.ts`, and Express editor server in `packages/biome-editor-server/package.json`.

**CI Pipeline:**
- None detected. No GitHub Actions, CircleCI, or other CI config files were found during this review.

## Environment Configuration

**Required env vars:**
- Website: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `VITE_BETTER_AUTH_URL`, `GAME_SERVER_API_KEY` from `packages/website/.env.example`, `packages/website/src/config/privateEnv.ts`, and `packages/website/src/config/publicEnv.ts`
- Game server: `GAME_SERVER_API_KEY`; optional `WEBSITE_API_URL`, `ADMIN_PASSWORD`, `ENABLE_EDITOR_MAP_RELOAD`, `EDITOR_MAP_RELOAD_ALLOW_NON_LOCAL`, `WEBSOCKET_IMPLEMENTATION` from `packages/game-server/.env.example`, `packages/game-server/src/config/env.ts`, and `packages/game-shared/src/config/network.ts`
- Biome editor server: `GAME_SERVER_API_KEY`, `GAME_SERVER_BASE_URL`, `NOTIFY_GAME_SERVER_ON_MAP_SAVE`, `PORT`, `JSON_BODY_LIMIT`, `EDITOR_API_LOG_WORLD_MAP_GET` from `packages/biome-editor-server/.env.example` and `packages/biome-editor-server/src/server.ts`
- Website editor UI: `VITE_API_BASE_URL` in `packages/website/src/routes/editor/-config/api.ts`

**Secrets location:**
- Example env files are committed in `packages/website/.env.example`, `packages/game-server/.env.example`, and `packages/biome-editor-server/.env.example`.
- Real secret-bearing env files exist at `packages/website/.env` and `packages/game-server/.env`; contents were intentionally not read.

## Webhooks & Callbacks

**Incoming:**
- Better Auth handler route at `packages/website/src/routes/api/auth/$.ts`
- Session validation endpoint at `packages/website/src/routes/api/session/validate.ts`
- Game persistence endpoints under `packages/website/src/routes/api/game/` including `player-experience.ts`, `add-experience.ts`, `player-last-position.ts`, `player-quest-progress.ts`, `ability-allocations.ts`, `character-allocations.ts`, `profession-progress.ts`, `skill-allocations.ts`, `player-stats.ts`, `player-respawn-bind.ts`, and `zombie-kill.ts`
- Biome editor HTTP endpoints in `packages/biome-editor-server/src/api/world-map-routes.ts` and `packages/biome-editor-server/src/api/biome-routes.ts`
- Game server editor reload endpoint path is referenced by `packages/biome-editor-server/src/util/notify-game-server-map-reload.ts` and enforced in `packages/game-server/src/managers/server-socket-manager.ts`
- Stripe webhook endpoint: Not detected in current route files despite the dev forwarding script in `packages/website/package.json`

**Outgoing:**
- Game server → website API calls for persistence and hydration:
  - `GET /api/game/player-experience` from `packages/game-server/src/managers/server-socket-manager.ts`
  - `POST /api/game/add-experience` from `packages/game-server/src/util/persist-experience-delta.ts`
  - `POST /api/game/player-last-position` from `packages/game-server/src/services/persist-player-last-position.ts`
  - `POST /api/game/player-quest-progress` from `packages/game-server/src/util/persist-quest-progress.ts`
  - `POST /api/game/ability-allocations` and `POST /api/game/character-allocations` from `packages/game-server/src/events/handlers/set-progression-allocations.ts`
- Website editor UI → biome editor server calls from `packages/website/src/routes/editor/-hooks/useEditorApi.ts`
- Biome editor server → game server reload callback `POST /__dev/reload-world-map` from `packages/biome-editor-server/src/util/notify-game-server-map-reload.ts`
- Browser → Google Fonts requests configured in `packages/website/src/routes/__root.tsx`

---

*Integration audit: 2026-04-15*
