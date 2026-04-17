# Technology Stack

**Analysis Date:** 2026-04-15

## Languages

**Primary:**
- TypeScript 5.x - Used across the monorepo in `package.json`, `tsconfig.json`, `packages/website/tsconfig.json`, `packages/game-server/tsconfig.json`, `packages/game-client/tsconfig.json`, `packages/game-shared/tsconfig.json`, and `packages/biome-editor-server/package.json`.

**Secondary:**
- SQL (PostgreSQL dialect) - Generated and managed through Drizzle config in `packages/website/drizzle.config.ts` and local Postgres provisioning in `packages/website/docker-compose.yml`.
- CSS - Processed through Tailwind/PostCSS in `packages/website/postcss.config.ts` and `packages/website/vite.config.ts`.

## Runtime

**Environment:**
- Node.js - Primary runtime for all packages. `packages/game-server/tsup.config.ts` targets Node 18 for the server build.
- Browser - React client runtime in `packages/website/src/**/*` and the shared game client exported from `packages/game-client/src/client.ts`.

**Package Manager:**
- npm workspaces - Defined in `package.json` with workspace packages under `packages/*`.
- Lockfile: present in `package-lock.json`.

## Frameworks

**Core:**
- TanStack Start `^1.137.0` - Full-stack React app framework for the website in `packages/website/package.json`, configured in `packages/website/vite.config.ts`.
- React `^19.2.0` + React DOM `^19.2.0` - UI runtime for the website in `packages/website/package.json`.
- TanStack Router `^1.136.18` - File-based routing for the website, with generated routes in `packages/website/src/routeTree.gen.ts` and API routes under `packages/website/src/routes/api/`.
- Express `^5.1.0` - HTTP API runtime for the biome editor service in `packages/biome-editor-server/package.json` and `packages/biome-editor-server/src/server.ts`.

**Testing:**
- Vitest `^2.1.8` - Test runner used in `packages/game-server/package.json`, `packages/game-client/package.json`, `packages/game-shared/package.json`, and configs in `packages/game-server/vitest.config.ts`, `packages/game-client/vitest.config.ts`, `packages/game-shared/vitest.config.ts`.

**Build/Dev:**
- Vite `^7.2.4` - Website dev/build tool in `packages/website/package.json` and `packages/website/vite.config.ts`.
- Nitro `^3.0.1-alpha.1` - Server output/runtime for the website in `packages/website/package.json`; production start reads `.output/server/index.mjs` in `packages/website/package.json`.
- tsup `^8.3.5` - Bundles Node services in `packages/game-server/tsup.config.ts` and `packages/biome-editor-server/package.json`.
- tsx `^4.19.2` - Watches and runs TypeScript Node services in `packages/game-server/package.json` and `packages/biome-editor-server/package.json`.
- Tailwind CSS `4.1.17` - Styling pipeline in `packages/website/package.json`, `packages/website/postcss.config.ts`, and `packages/website/vite.config.ts`.

## Key Dependencies

**Critical:**
- `drizzle-orm` `^0.44.7` - Primary database access layer in `packages/website/src/db/index.ts` and schema definitions in `packages/website/src/db/schema.ts`.
- `better-auth` `^1.3.34` - Website auth/session system in `packages/website/src/utils/auth.ts`, client config in `packages/website/src/lib/auth-client.ts`, and route handler in `packages/website/src/routes/api/auth/$.ts`.
- `socket.io` `^4.8.1` - Realtime server adapter option for the game server in `packages/game-server/package.json` and `packages/game-server/src/network/socketio-server-adapter.ts`.
- `uwebsockets.js` `github:uNetworking/uWebSockets.js#v20.56.0` - Default low-level websocket implementation selected in `packages/game-shared/src/config/network.ts` and used by `packages/game-server/src/network/uwebsockets-server-adapter.ts`.
- `socket.io-client` `^4.8.1` - Browser/client networking adapter in `packages/game-client/src/network/socketio-client-adapter.ts` and `packages/website/package.json`.

**Infrastructure:**
- `pg` `^8.16.3` - PostgreSQL driver in `packages/website/src/db/index.ts`.
- `drizzle-kit` `^0.31.7` - Migration/generation tool in `packages/website/package.json` and `packages/website/drizzle.config.ts`.
- `dotenv` `^16.4.7` - Environment loading for Node services in `packages/game-server/src/config/env.ts` and `packages/biome-editor-server/src/server.ts`.
- `@tanstack/react-query` `^5.90.10` - Website server-state/data-fetching layer in `packages/website/src/routes/editor/-hooks/useEditorApi.ts` and other query modules under `packages/website/src/queries/`.
- `zod` `^4.1.12` - Runtime validation dependency available in `packages/website/package.json`; use is present in website package dependencies but central validation wrappers are not concentrated in a single config file.
- `dependency-cruiser` `^16.9.0` - Dependency graph tooling exposed via `package.json` script `depcruiser`.

## Configuration

**Environment:**
- Website private env is read from `packages/website/src/config/privateEnv.ts` and requires `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GAME_SERVER_API_KEY`.
- Website public env is read from `packages/website/src/config/publicEnv.ts` and requires `VITE_BETTER_AUTH_URL`; editor UI also reads `VITE_API_BASE_URL` in `packages/website/src/routes/editor/-config/api.ts`.
- Website dev/build env is merged into `process.env` inside `packages/website/vite.config.ts` so Nitro/server functions can read the same values.
- Game server env is loaded in `packages/game-server/src/config/env.ts` and documents `GAME_SERVER_API_KEY` plus website linkage via `WEBSITE_API_URL`.
- Biome editor env is loaded by `import "dotenv/config"` in `packages/biome-editor-server/src/server.ts` and uses `PORT`, `JSON_BODY_LIMIT`, `GAME_SERVER_BASE_URL`, `GAME_SERVER_API_KEY`, and `NOTIFY_GAME_SERVER_ON_MAP_SAVE` in `packages/biome-editor-server/src/util/notify-game-server-map-reload.ts`.
- Example env files are present in `packages/website/.env.example`, `packages/game-server/.env.example`, and `packages/biome-editor-server/.env.example`. Real `.env` files exist in `packages/website/.env` and `packages/game-server/.env` but were not read.

**Build:**
- Root TypeScript project references are defined in `tsconfig.json`.
- Website bundling and SSR config live in `packages/website/vite.config.ts`.
- Database migration config lives in `packages/website/drizzle.config.ts`.
- Website PostCSS/Tailwind config lives in `packages/website/postcss.config.ts`.
- Game server bundling config lives in `packages/game-server/tsup.config.ts`.
- Vitest configs live in `packages/game-server/vitest.config.ts`, `packages/game-client/vitest.config.ts`, and `packages/game-shared/vitest.config.ts`.

## Platform Requirements

**Development:**
- Node.js with npm workspace support is required by `package.json`.
- Local PostgreSQL 17 via Docker Compose is expected by `packages/website/docker-compose.yml` and the root DB scripts in `package.json`.
- Local website dev runs on port 3000 in `packages/website/vite.config.ts`.
- Local game server defaults to port 3001 in `packages/game-server/src/core/server.ts`.
- Local biome editor server defaults to port 3002 in `packages/biome-editor-server/src/server.ts`.

**Production:**
- Website production runs the Nitro server output from `packages/website/package.json` (`node .output/server/index.mjs`).
- Game server production build emits CommonJS output to `packages/game-server/dist` via `packages/game-server/tsup.config.ts`.
- Biome editor service is a standalone Node/Express process built from `packages/biome-editor-server/src/server.ts`.

---

*Stack analysis: 2026-04-15*
