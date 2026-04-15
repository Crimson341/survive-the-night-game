# Architecture

**Analysis Date:** 2026-04-15

## Pattern Overview

**Overall:** Multi-package monorepo with a server-authoritative game runtime, a shared protocol/config package, a browser game client, a TanStack Start web app, and a separate Express-based map authoring service.

**Key Characteristics:**
- Keep gameplay rules authoritative in `packages/game-server/src/**`; clients render and submit intent.
- Put cross-package protocol, config, registries, and serialization rules in `packages/game-shared/src/**`.
- Treat `packages/website/src/**` as a separate full-stack application that hosts login, persistent player data, the game launcher, and the map editor UI.

## Layers

**Workspace orchestration:**
- Purpose: Coordinate package-level development and builds.
- Location: `package.json`, `tsconfig.json`
- Contains: npm workspaces, root scripts, TypeScript project references.
- Depends on: package-local configs.
- Used by: every package under `packages/*`.

**Shared contract layer:**
- Purpose: Define data contracts, entity registries, event names, network adapter interfaces, and shared game configuration.
- Location: `packages/game-shared/src/`
- Contains: `packages/game-shared/src/events/events.ts`, `packages/game-shared/src/entities/index.ts`, `packages/game-shared/src/config/entity-registration.ts`, `packages/game-shared/src/network/index.ts`, `packages/game-shared/src/map/*`, `packages/game-shared/src/util/*`.
- Depends on: internal TypeScript modules only.
- Used by: `packages/game-server`, `packages/game-client`, `packages/website`, and `packages/biome-editor-server`.

**Authoritative simulation layer:**
- Purpose: Run the game loop, own entity state, load maps, process socket input, and broadcast authoritative updates.
- Location: `packages/game-server/src/`
- Contains: `packages/game-server/src/core/server.ts`, `packages/game-server/src/core/game-loop.ts`, `packages/game-server/src/managers/*`, `packages/game-server/src/world/map-manager.ts`, `packages/game-server/src/events/handlers/*`, `packages/game-server/src/entities/*`, `packages/game-server/src/extensions/*`.
- Depends on: `@shared/*`, local services in `packages/game-server/src/services/*`, and local transport adapters in `packages/game-server/src/network/*`.
- Used by: browser clients over WebSocket and the website over HTTP-backed persistence endpoints.

**Presentation/runtime client layer:**
- Purpose: Instantiate the browser game, manage canvas rendering, local UI, interpolation/prediction, and network event handling.
- Location: `packages/game-client/src/`
- Contains: `packages/game-client/src/client.ts`, `packages/game-client/src/scenes/*`, `packages/game-client/src/managers/*`, `packages/game-client/src/events/*`, `packages/game-client/src/ui/*`, `packages/game-client/src/entities/*`, `packages/game-client/src/extensions/*`.
- Depends on: `@shared/*`, selected server types via `@server/*`, browser DOM APIs, and `socket.io-client`/uWS client adapters.
- Used by: the website route `packages/website/src/routes/play.tsx` through a dynamic import of `@survive-the-night/game-client/scenes`.

**Website application layer:**
- Purpose: Serve the public site, auth flows, persistent player data, game auth token issuance, admin/editor UI, and API routes for the game server.
- Location: `packages/website/src/`
- Contains: routes in `packages/website/src/routes/*`, server functions in `packages/website/src/fn/*`, database access in `packages/website/src/data-access/*`, schema in `packages/website/src/db/*`, shared UI in `packages/website/src/components/*`.
- Depends on: TanStack Start, Drizzle, Better Auth, PostgreSQL, and workspace packages `@survive-the-night/game-client` / `@survive-the-night/game-shared`.
- Used by: end users in the browser and `packages/game-server/src/managers/server-socket-manager.ts` via website API calls.

**Editor backend layer:**
- Purpose: Persist authored biome and world-map data and notify the game server to reload authored map assets.
- Location: `packages/biome-editor-server/src/`
- Contains: `packages/biome-editor-server/src/server.ts`, `packages/biome-editor-server/src/api/world-map-routes.ts`, `packages/biome-editor-server/src/api/biome-routes.ts`, `packages/biome-editor-server/src/util/*`.
- Depends on: Express, filesystem helpers, and `@shared/*` map types.
- Used by: the website editor route `packages/website/src/routes/editor/index.tsx` through hooks in `packages/website/src/routes/editor/-hooks/useEditorApi.ts`.

## Data Flow

**Gameplay session flow:**

1. `packages/website/src/routes/play.tsx` authenticates the browser session and calls `packages/website/src/fn/game-auth.ts` to mint a short-lived game token.
2. The dynamically imported browser runtime from `packages/game-client/src/scenes/scene-manager.ts` / `packages/game-client/src/client.ts` opens a socket using `packages/game-client/src/network/adapter-factory.ts`.
3. `packages/game-server/src/managers/server-socket-manager.ts` validates the token with `packages/game-server/src/services/session-validator.ts`, loads persisted player progress from website API routes such as `packages/website/src/routes/api/game/player-experience.ts`, and creates or restores the player.
4. `packages/game-server/src/core/game-loop.ts` updates entities through `packages/game-server/src/managers/entity-manager.ts`, reads map state from `packages/game-server/src/world/map-manager.ts`, and broadcasts authoritative state/events defined in `packages/game-shared/src/events/events.ts`.
5. `packages/game-client/src/client-event-listener.ts` converts server events into local state updates in `packages/game-client/src/state.ts`, then `packages/game-client/src/client.ts` renders frames and drives HUD/prediction systems.

**Map authoring flow:**

1. `packages/website/src/routes/editor/index.tsx` loads editor state into the zustand store in `packages/website/src/routes/editor/-store.ts`.
2. Data fetch/save hooks in `packages/website/src/routes/editor/-hooks/useEditorApi.ts` call the editor API base declared in `packages/website/src/routes/editor/-config/api.ts`.
3. `packages/biome-editor-server/src/api/world-map-routes.ts` reads/writes world map bundles through `packages/biome-editor-server/src/util/world-map-file-handler.ts`.
4. After saves, `packages/biome-editor-server/src/util/notify-game-server-map-reload.ts` notifies the game server so `packages/game-server/src/world/map-manager.ts` can reload authored map content on the next initialization path.

**Persistence flow:**

1. Database access starts at `packages/website/src/db/index.ts` and schema definitions in `packages/website/src/db/schema.ts`.
2. Thin query modules in `packages/website/src/data-access/users.ts` and `packages/website/src/data-access/user-stats.ts` encapsulate SQL/Drizzle calls.
3. Server functions in `packages/website/src/fn/*` and file routes in `packages/website/src/routes/api/*` use those data-access modules instead of querying directly from React route components.
4. `packages/game-server/src/managers/server-socket-manager.ts` uses HTTP calls plus `X-API-Key` auth enforced by `packages/website/src/utils/game-server-api-auth.ts` to hydrate and persist runtime player progress.

**State Management:**
- Server runtime state is centralized in `packages/game-server/src/core/game-loop.ts`, `packages/game-server/src/managers/entity-manager.ts`, and `packages/game-server/src/world/map-manager.ts`.
- Browser runtime state is centralized in the mutable `GameState` object from `packages/game-client/src/state.ts`.
- Website UI state is split between TanStack Router route state, TanStack Query caches in `packages/website/src/router.tsx`, and localized zustand state for the editor in `packages/website/src/routes/editor/-store.ts`.

## Key Abstractions

**GameServer orchestrator:**
- Purpose: Wire together simulation managers and expose lifecycle methods.
- Examples: `packages/game-server/src/server.ts`, `packages/game-server/src/core/server.ts`
- Pattern: Composition root that owns `ServerSocketManager`, `EntityManager`, `MapManager`, and `GameLoop`.

**GameLoop strategy boundary:**
- Purpose: Separate tick orchestration from game-mode rules.
- Examples: `packages/game-server/src/core/game-loop.ts`, `packages/game-server/src/game-modes/game-mode-strategy.ts`, `packages/game-server/src/game-modes/open-world-mode-strategy.ts`
- Pattern: Strategy pattern injected into a fixed-timestep loop.

**Entity + extension model:**
- Purpose: Represent gameplay objects through base entities plus attachable behaviors.
- Examples: `packages/game-server/src/entities/entity.ts`, `packages/game-server/src/extensions/index.ts`, `packages/game-client/src/extensions/index.ts`
- Pattern: ECS-adjacent entity/extension composition, with parallel server and client implementations.

**Shared registration pipeline:**
- Purpose: Keep entity type ordering and constructor registration aligned across packages.
- Examples: `packages/game-shared/src/config/entity-registration.ts`, `packages/game-server/src/entities/register-custom-entities.ts`, `packages/game-client/src/entities/register-custom-entities.ts`
- Pattern: Shared registration config plus per-runtime override registries.

**Factory fallback for entities:**
- Purpose: Prefer custom classes, then fall back to config-driven generic entities.
- Examples: `packages/game-shared/src/util/entity-factory-pattern.ts`, `packages/game-server/src/managers/entity-manager.ts`, `packages/game-client/src/entities/entity-factory.ts`
- Pattern: Adapter-backed factory pattern reused by server and client.

**Network adapter abstraction:**
- Purpose: Hide transport details while supporting Socket.IO and uWebSockets variants.
- Examples: `packages/game-shared/src/network/server-adapter.ts`, `packages/game-shared/src/network/client-adapter.ts`, `packages/game-server/src/network/adapter-factory.ts`, `packages/game-client/src/network/adapter-factory.ts`
- Pattern: Adapter/factory pattern with shared interfaces.

**Website layered backend:**
- Purpose: Separate transport, auth middleware, business functions, and database access.
- Examples: `packages/website/src/routes/api/game/player-experience.ts`, `packages/website/src/fn/users.ts`, `packages/website/src/fn/middleware.ts`, `packages/website/src/data-access/users.ts`
- Pattern: Route/server-function -> middleware -> data-access -> DB.

## Entry Points

**Game server process:**
- Location: `packages/game-server/src/server.ts`
- Triggers: `npm run dev:server` at root and `npm run dev` inside `packages/game-server`.
- Responsibilities: Instantiate `GameServer`, bootstrap the map/session, and persist player positions on shutdown.

**Game browser runtime:**
- Location: `packages/game-client/src/client.ts`
- Triggers: `packages/website/src/routes/play.tsx` through scene bootstrapping from `@survive-the-night/game-client/scenes`.
- Responsibilities: Own canvas runtime services, input, HUD, particles, prediction, and rendering.

**Website router:**
- Location: `packages/website/src/router.tsx`
- Triggers: TanStack Start app startup.
- Responsibilities: Create the router, attach `QueryClient`, and bind SSR query integration.

**Website root route:**
- Location: `packages/website/src/routes/__root.tsx`
- Triggers: Every website request/render.
- Responsibilities: Provide global head metadata, theme initialization, navigation shell, route outlet, and progress indicators.

**Biome editor API server:**
- Location: `packages/biome-editor-server/src/server.ts`
- Triggers: `npm run dev:biome-editor` at root and `npm run dev` inside `packages/biome-editor-server`.
- Responsibilities: Mount JSON APIs for biomes and world maps and expose `/health`.

## Error Handling

**Strategy:** Localized guards and fail-fast validation at service boundaries, with console logging rather than a shared cross-package error framework.

**Patterns:**
- Validate incoming auth/session state early in `packages/game-server/src/managers/server-socket-manager.ts` and disconnect or return explicit events like `AuthRequiredEvent` / `ProfileLoadFailedEvent` when validation fails.
- Return `Response` objects with status codes from website API routes such as `packages/website/src/routes/api/game/player-experience.ts` and helper validators like `packages/website/src/utils/game-server-api-auth.ts`.
- Throw plain `Error` objects inside TanStack Start server functions and middleware in `packages/website/src/fn/users.ts` and `packages/website/src/fn/middleware.ts`.
- Log map/editor failures at the route boundary in `packages/biome-editor-server/src/api/world-map-routes.ts`.

## Cross-Cutting Concerns

**Logging:** Console-based logging is used directly in `packages/game-server/src/core/game-loop.ts`, `packages/game-server/src/managers/server-socket-manager.ts`, `packages/biome-editor-server/src/server.ts`, and website API routes.

**Validation:** Runtime validation lives at boundaries: token checks in `packages/game-server/src/services/session-validator.ts`, API key checks in `packages/website/src/utils/game-server-api-auth.ts`, request parsing in `packages/biome-editor-server/src/api/world-map-routes.ts`, and Zod input validation in server functions like `packages/website/src/fn/users.ts`.

**Authentication:** Browser auth uses Better Auth in `packages/website/src/utils/auth.ts`; TanStack Start middleware in `packages/website/src/fn/middleware.ts` protects server functions; gameplay sockets use short-lived HMAC tokens issued by `packages/website/src/fn/game-auth.ts` and validated by `packages/game-server/src/services/session-validator.ts`.

---

*Architecture analysis: 2026-04-15*
