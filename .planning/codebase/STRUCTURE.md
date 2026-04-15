# Codebase Structure

**Analysis Date:** 2026-04-15

## Directory Layout

```text
survive-the-night-game/
├── `packages/game-server/`         # Authoritative multiplayer simulation server
├── `packages/game-client/`         # Canvas game runtime consumed by the website
├── `packages/game-shared/`         # Shared config, contracts, registries, and utilities
├── `packages/website/`             # TanStack Start website, auth, persistence, and editor UI
├── `packages/biome-editor-server/` # Separate Express API for world-map/biome authoring
├── `docs/`                         # Human-written implementation notes and design references
├── `opensrc/`                      # Vendored dependency source snapshots for reference
├── `scripts/`                      # Small project utilities outside the runtime packages
├── `.planning/codebase/`           # Generated codebase maps for GSD workflows
├── `package.json`                  # Workspace scripts and package graph root
└── `tsconfig.json`                 # Root TypeScript project references
```

## Directory Purposes

**`packages/game-server/src/`:**
- Purpose: Keep all authoritative game runtime code together.
- Contains: process entrypoint, game loop, managers, socket handlers, entities, extensions, services, and world generation.
- Key files: `packages/game-server/src/server.ts`, `packages/game-server/src/core/server.ts`, `packages/game-server/src/core/game-loop.ts`, `packages/game-server/src/managers/server-socket-manager.ts`, `packages/game-server/src/world/map-manager.ts`.

**`packages/game-server/src/entities/`:**
- Purpose: Define server-side entity classes.
- Contains: category subfolders such as `players/`, `enemies/`, `items/`, `environment/`, `projectiles/`, plus `register-custom-entities.ts`.
- Key files: `packages/game-server/src/entities/entity.ts`, `packages/game-server/src/entities/register-custom-entities.ts`.

**`packages/game-server/src/extensions/`:**
- Purpose: Implement server-side behaviors attached to entities.
- Contains: one file per behavior, plus `index.ts` and shared extension types.
- Key files: `packages/game-server/src/extensions/index.ts`, `packages/game-server/src/extensions/positionable.ts`, `packages/game-server/src/extensions/destructible.ts`.

**`packages/game-server/src/events/handlers/`:**
- Purpose: Map client socket events to authoritative handlers.
- Contains: one file per client event plus a central registry.
- Key files: `packages/game-server/src/events/handlers/registry.ts`, `packages/game-server/src/events/handlers/player-input.ts`, `packages/game-server/src/events/handlers/full-state.ts`.

**`packages/game-client/src/`:**
- Purpose: Hold the browser game runtime.
- Contains: `client.ts`, state helpers, renderer/scenes, managers, event handlers, entities, extensions, and canvas UI.
- Key files: `packages/game-client/src/client.ts`, `packages/game-client/src/state.ts`, `packages/game-client/src/client-event-listener.ts`, `packages/game-client/src/scenes/scene-manager.ts`.

**`packages/game-client/src/ui/`:**
- Purpose: Keep canvas HUD and overlay code separate from transport and simulation glue.
- Contains: HUD widgets, quest panels, inventory/crafting overlays, map overlays, and `panels/` utilities.
- Key files: `packages/game-client/src/ui/hud.ts`, `packages/game-client/src/ui/chat-widget.ts`, `packages/game-client/src/ui/panels/index.ts`.

**`packages/game-shared/src/`:**
- Purpose: Centralize reusable code that must stay consistent across packages.
- Contains: `commands/`, `config/`, `constants/`, `entities/`, `events/`, `map/`, `network/`, `quests/`, `types/`, and `util/`.
- Key files: `packages/game-shared/src/events/events.ts`, `packages/game-shared/src/entities/index.ts`, `packages/game-shared/src/config/entity-registration.ts`, `packages/game-shared/src/network/index.ts`.

**`packages/website/src/routes/`:**
- Purpose: File-based routing for the website.
- Contains: top-level pages, nested route folders, API routes, and private helper folders prefixed with `-`.
- Key files: `packages/website/src/routes/__root.tsx`, `packages/website/src/routes/index.tsx`, `packages/website/src/routes/play.tsx`, `packages/website/src/routes/editor/index.tsx`, `packages/website/src/routes/api/game/player-experience.ts`.

**`packages/website/src/components/`:**
- Purpose: Shared React UI components.
- Contains: layout components, app-specific pieces, and a `ui/` folder of base primitives.
- Key files: `packages/website/src/components/Header.tsx`, `packages/website/src/components/Footer.tsx`, `packages/website/src/components/ui/button.tsx`.

**`packages/website/src/fn/`:**
- Purpose: TanStack Start server functions and middleware.
- Contains: auth-aware business logic and server-only helpers.
- Key files: `packages/website/src/fn/game-auth.ts`, `packages/website/src/fn/middleware.ts`, `packages/website/src/fn/settings.ts`.

**`packages/website/src/data-access/`:**
- Purpose: Keep database reads/writes behind thin query modules.
- Contains: user and user-stats queries.
- Key files: `packages/website/src/data-access/users.ts`, `packages/website/src/data-access/user-stats.ts`.

**`packages/website/src/db/`:**
- Purpose: Database connection and schema source of truth.
- Contains: Drizzle client wiring and schema definitions.
- Key files: `packages/website/src/db/index.ts`, `packages/website/src/db/schema.ts`.

**`packages/website/src/routes/editor/`:**
- Purpose: Keep the map editor feature self-contained.
- Contains: main route, local zustand store, feature hooks, feature config, feature types, and colocated `-components/`.
- Key files: `packages/website/src/routes/editor/index.tsx`, `packages/website/src/routes/editor/-store.ts`, `packages/website/src/routes/editor/-hooks/useEditorApi.ts`, `packages/website/src/routes/editor/-config/api.ts`.

**`packages/biome-editor-server/src/`:**
- Purpose: Isolate authoring APIs from the gameplay socket server.
- Contains: Express entrypoint, API routers, middleware, and file utilities.
- Key files: `packages/biome-editor-server/src/server.ts`, `packages/biome-editor-server/src/api/world-map-routes.ts`, `packages/biome-editor-server/src/util/world-map-file-handler.ts`.

## Key File Locations

**Entry Points:**
- `package.json`: root workspace scripts.
- `packages/game-server/src/server.ts`: boot authoritative multiplayer server.
- `packages/game-client/src/client.ts`: browser runtime class used by scenes.
- `packages/website/src/router.tsx`: construct TanStack router and query client.
- `packages/website/src/routes/__root.tsx`: root document/layout route.
- `packages/biome-editor-server/src/server.ts`: boot editor API service.

**Configuration:**
- `tsconfig.json`: root project references.
- `.dependency-cruiser.cjs`: dependency rules for the monorepo.
- `packages/game-server/tsconfig.json`: aliases `@/*` and `@shared/*` for server code.
- `packages/game-client/tsconfig.json`: aliases `@/*`, `@shared/*`, and `@server/*` for client code.
- `packages/website/tsconfig.json`: aliases `~/*`, `@/*`, `@shared/*`, and `@events/*`.
- `packages/website/vite.config.ts`: TanStack Start/Vite/Nitro setup.
- `packages/website/drizzle.config.ts`: Drizzle migrations output to `packages/website/drizzle/`.

**Core Logic:**
- `packages/game-server/src/core/`: game bootstrap and ticking.
- `packages/game-server/src/managers/`: runtime coordinators.
- `packages/game-server/src/world/`: map generation, loading, and authored map integration.
- `packages/game-client/src/managers/`: client-side runtime systems.
- `packages/game-shared/src/config/`: shared config and registration definitions.
- `packages/website/src/fn/` + `packages/website/src/data-access/`: website backend logic.

**Testing:**
- `packages/game-shared/src/**/*.test.ts`: shared logic tests live next to source.
- `packages/game-client/src/**/*.test.ts`: client tests live next to source.
- `packages/game-server` and `packages/biome-editor-server`: Vitest configs exist, but tests are less centralized than in shared/client packages.

## Naming Conventions

**Files:**
- Use kebab-case for most TypeScript modules in non-React packages: `packages/game-server/src/core/game-loop.ts`, `packages/game-client/src/managers/client-socket-manager.ts`, `packages/game-shared/src/config/entity-registration.ts`.
- Use PascalCase for website React components and a few feature modules: `packages/website/src/components/Header.tsx`, `packages/website/src/routes/editor/-components/TileMapEditor.tsx`.
- Use TanStack route names directly for route files: `packages/website/src/routes/play.tsx`, `packages/website/src/routes/sign-in.tsx`, `packages/website/src/routes/api/auth/$.ts`, `packages/website/src/routes/__root.tsx`.

**Directories:**
- Use package boundaries first: `packages/game-server`, `packages/game-client`, `packages/game-shared`, `packages/website`, `packages/biome-editor-server`.
- Use domain folders under runtime packages: `entities/`, `extensions/`, `managers/`, `world/`, `events/`, `services/`.
- In the website, keep route-private helpers in dash-prefixed folders inside the route folder: `packages/website/src/routes/editor/-components/`, `packages/website/src/routes/editor/-hooks/`, `packages/website/src/routes/play/-components/`.

## Where to Add New Code

**New gameplay feature:**
- Shared contracts/config first: `packages/game-shared/src/config/`, `packages/game-shared/src/events/`, `packages/game-shared/src/entities/`, or `packages/game-shared/src/util/`.
- Server authority next: `packages/game-server/src/entities/`, `packages/game-server/src/extensions/`, `packages/game-server/src/events/handlers/`, or `packages/game-server/src/managers/`.
- Client rendering/UI last: `packages/game-client/src/entities/`, `packages/game-client/src/extensions/`, `packages/game-client/src/events/`, `packages/game-client/src/ui/`.
- Tests: colocate under the touched package using `*.test.ts`.

**New website page or API:**
- Route file: `packages/website/src/routes/`.
- Server-only business logic: `packages/website/src/fn/`.
- Database access: `packages/website/src/data-access/`.
- Shared React UI: `packages/website/src/components/`.

**New map editor capability:**
- UI and local state: `packages/website/src/routes/editor/` with colocated `-components/`, `-hooks/`, `-utils.ts`, or `-store.ts`.
- Persistence/API changes: `packages/biome-editor-server/src/api/` and `packages/biome-editor-server/src/util/`.
- Shared map typing: `packages/game-shared/src/map/`.

**Utilities:**
- Shared cross-package helpers: `packages/game-shared/src/util/`.
- Server-only helpers: `packages/game-server/src/util/` or `packages/game-server/src/services/` depending on whether the code is pure helper logic or external/service orchestration.
- Client-only helpers: `packages/game-client/src/util/`.
- Website-only helpers: `packages/website/src/utils/`.

## Special Directories

**`packages/website/drizzle/`:**
- Purpose: Generated SQL migrations and migration metadata.
- Generated: Yes.
- Committed: Yes.

**`packages/website/.tanstack/`:**
- Purpose: TanStack Start generated artifacts.
- Generated: Yes.
- Committed: Yes in current state.

**`packages/website/src/routeTree.gen.ts`:**
- Purpose: Generated TanStack route tree consumed by `packages/website/src/router.tsx`.
- Generated: Yes.
- Committed: Yes.

**`packages/website/.output/`:**
- Purpose: Built server/client output for the website package.
- Generated: Yes.
- Committed: No in normal workflows; present in the working tree state.

**`packages/*/dist/`:**
- Purpose: Build output for individual packages.
- Generated: Yes.
- Committed: No in intended workflows; present locally.

**`packages/game-server/src/*.js` and `packages/game-server/src/*.d.ts` alongside `.ts`:**
- Purpose: Transpiled/runtime artifacts colocated with source in the current repository state.
- Generated: Yes.
- Committed: Yes in current state.

**`opensrc/`:**
- Purpose: Local source snapshots for third-party packages referenced by `AGENTS.md`.
- Generated: Yes, via the `opensrc` toolchain.
- Committed: Yes in current state.

**`.planning/codebase/`:**
- Purpose: Generated architecture/stack/convention maps consumed by GSD commands.
- Generated: Yes.
- Committed: Intended to be committed.

---

*Structure analysis: 2026-04-15*
