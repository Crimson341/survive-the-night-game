# Coding Conventions

**Analysis Date:** 2026-04-15

## Naming Patterns

**Files:**
- Use kebab-case for most TypeScript modules in `packages/game-shared/src/util/recipes.ts`, `packages/game-client/src/ui/quest-tracker-target.ts`, and `packages/game-server/src/events/handlers/set-progression-allocations.ts`.
- Use PascalCase for React components under `packages/website/src/components/` and route-local component folders like `packages/website/src/routes/editor/-components/QuestsEditorPanel.tsx` and `packages/website/src/components/ui/button.tsx`.
- Use framework-driven special filenames for routes and generated files such as `packages/website/src/routes/__root.tsx`, `packages/website/src/routes/api/auth/$.ts`, and `packages/website/src/routeTree.gen.ts`.
- Use prefix-hyphen route support files for private route modules in `packages/website/src/routes/editor/-store.ts`, `packages/website/src/routes/editor/-types.ts`, and `packages/website/src/routes/editor/-hooks/useEditorApi.ts`.

**Functions:**
- Use camelCase for functions and helpers, including exported helpers like `resolvePrimaryQuestTracker` in `packages/game-client/src/ui/quest-tracker-target.ts`, `recipeCanBeCrafted` in `packages/game-shared/src/util/recipes.ts`, and `setProgressionAllocations` in `packages/game-server/src/events/handlers/set-progression-allocations.ts`.
- Use `onX` naming for event callbacks in `packages/game-client/src/client-event-listener.ts` and `packages/game-client/src/events/*` imports.
- Use `create*`, `normalize*`, `resolve*`, `persist*`, and `update*` prefixes for data-shaping and persistence helpers in `packages/website/src/data-access/user-stats.ts` and `packages/game-shared/src/map/world-map-types.ts`.

**Variables:**
- Use camelCase for locals and parameters throughout the codebase, for example `playerWorldX`, `npcCandidates`, and `bestDistSq` in `packages/game-client/src/ui/quest-tracker-target.ts`.
- Use UPPER_SNAKE_CASE for constants and config-ish values such as `QUEST_TRACKER_HEADINGS` in `packages/game-client/src/ui/quest-tracker-target.ts`, `MAX_UNDO_HISTORY` in `packages/website/src/routes/editor/-store.ts`, and `STATIC_ENTITIES` in `packages/game-server/src/managers/entity-manager.ts`.
- Use short one-letter temporaries only inside very local array logic or tests, such as `a` in `packages/game-shared/src/util/progression-allocation.test.ts` and `e` in `packages/website/src/routes/editor/-store.ts`.

**Types:**
- Use PascalCase for interfaces, classes, and type aliases such as `QuestTrackerResolution` in `packages/game-client/src/ui/quest-tracker-target.ts`, `WorldMapDataResponse` in `packages/website/src/routes/editor/-hooks/useEditorApi.ts`, and `EntityManager` in `packages/game-server/src/managers/entity-manager.ts`.
- Use `type` imports where possible, as seen in `packages/website/src/routes/editor/-hooks/useEditorApi.ts`, `packages/game-shared/src/quests/player-quest-state.test.ts`, and `packages/website/src/data-access/user-stats.ts`.

## Code Style

**Formatting:**
- No formatter config was detected at the repo root (`.prettierrc*`, `biome.json`) or package roots.
- Follow the existing 2-space indentation and semicolon-heavy style shown in `packages/website/src/components/ui/button.tsx`, `packages/game-client/src/ui/quest-tracker-target.ts`, and `packages/game-server/src/events/handlers/set-progression-allocations.ts`.
- Prefer double quotes over single quotes across the repo.
- Keep long callsites multi-line with trailing commas, especially in object literals and JSX props, as in `packages/website/src/routes/sign-in.tsx` and `packages/game-shared/src/quests/player-quest-state.test.ts`.

**Linting:**
- No repo ESLint config was detected (`eslint.config.*`, `.eslintrc*`).
- Inline lint suppression appears rarely and locally, for example `// eslint-disable-next-line react-hooks/exhaustive-deps` in `packages/website/src/routes/editor/-components/TileMapEditor.tsx`.
- Type suppressions exist and should be treated as exceptions, not the default pattern: `packages/website/src/routes/sign-in.tsx`, `packages/website/src/routes/sign-up.tsx`, `packages/website/src/routes/settings.tsx`, and `packages/website/src/routes/play.tsx` use `// @ts-ignore`.

## Import Organization

**Order:**
1. Third-party packages first, e.g. `packages/website/src/routes/sign-in.tsx` starts with TanStack, React Hook Form, Zod, and React imports.
2. Internal aliases second, e.g. `~/...`, `@/...`, and `@shared/...` imports in `packages/website/src/routes/sign-in.tsx`, `packages/game-server/src/managers/entity-manager.ts`, and `packages/game-client/src/entities/entity-factory.ts`.
3. Relative imports last, typically for sibling files such as `./quest-display` in `packages/game-client/src/ui/quest-tracker-target.ts` and `./entity-state-tracker` in `packages/game-server/src/managers/entity-manager.ts`.

**Path Aliases:**
- `~/` points to `packages/website/src/*` via `packages/website/tsconfig.json`.
- `@/` points to package-local `src/*` in `packages/game-client/tsconfig.json`, `packages/game-server/tsconfig.json`, and `packages/game-shared/tsconfig.json`.
- `@shared/` points from client/server/website packages into `packages/game-shared/src/*`.
- `@events/` is used for shared event modules per `packages/game-shared/tsconfig.json` and `packages/website/tsconfig.json`.
- Some older files still use deep relative cross-package imports instead of aliases, for example `packages/game-client/src/ui/quest-tracker-target.ts` and `packages/game-client/src/client-event-listener.ts`.

## Error Handling

**Patterns:**
- Throw hard errors for invalid invariants and impossible states, e.g. `throw new Error(...)` in `packages/game-server/src/managers/entity-manager.ts`, `packages/game-client/src/entities/entity-factory.ts`, and `packages/game-shared/src/util/interactable-text-encoding.ts`.
- Return early for invalid request state in handlers rather than nesting, as in `packages/game-server/src/events/handlers/set-progression-allocations.ts` and `packages/website/src/fn/guards.ts`.
- Wrap network and persistence boundaries in `try/catch`, then convert failures to warnings, logs, or HTTP responses in `packages/website/src/routes/api/game/player-experience.ts`, `packages/website/src/routes/editor/-hooks/useEditorApi.ts`, and `packages/game-server/src/events/handlers/set-progression-allocations.ts`.
- Normalize untrusted data before using it. This is a strong convention in `packages/website/src/data-access/user-stats.ts`, `packages/game-shared/src/quests/player-quest-state.ts`, and `packages/game-shared/src/util/progression-allocation.ts`.

## Logging

**Framework:** console

**Patterns:**
- Use `console.warn` for recoverable runtime issues, such as persistence failures or unknown entity types in `packages/game-server/src/events/handlers/set-progression-allocations.ts`, `packages/game-server/src/managers/entity-manager.ts`, and `packages/game-client/src/entities/entity-factory.ts`.
- Use `console.error` for unexpected failures at API and server boundaries, as in `packages/website/src/routes/api/game/player-experience.ts` and `packages/game-server/src/services/kill-tracker.ts`.
- Use `console.info` sparingly for dev-only diagnostics, for example in `packages/website/src/routes/editor/-hooks/useEditorApi.ts` behind `import.meta.env.DEV`.
- Prefer message prefixes that name the subsystem, such as `[setProgressionAllocations]` in `packages/game-server/src/events/handlers/set-progression-allocations.ts` and route-specific messages like `"player-experience GET error:"` in `packages/website/src/routes/api/game/player-experience.ts`.

## Comments

**When to Comment:**
- Comment intent, invariants, and edge cases rather than restating syntax. Strong examples appear in `packages/game-client/src/client-event-listener.ts`, `packages/game-server/src/managers/entity-manager.ts`, and `packages/website/src/routes/editor/-store.ts`.
- Use short inline comments to explain fallback behavior or defensive branches, such as malformed local storage handling in `packages/website/src/routes/editor/-store.ts`.
- Use comments heavily in complex gameplay and editor code, especially where runtime behavior is subtle, e.g. `packages/game-server/src/entities/enemies/base-enemy.ts` and `packages/website/src/routes/editor/-components/TileMapEditor.tsx`.

**JSDoc/TSDoc:**
- JSDoc is used selectively for exported helpers, data contracts, and editor internals, not universally.
- Good examples include `packages/website/src/data-access/user-stats.ts`, `packages/website/src/db/index.ts`, `packages/game-client/src/client-event-listener.ts`, and `packages/game-shared/src/entities/behavior-configs.ts`.
- When documenting exported functions, prefer concise behavior-focused comments immediately above the declaration.

## Function Design

**Size:**
- Small pure helpers are common in shared logic, such as `parseNpcKeyToTile`, `worldToTile`, and `tileToWorld` in `packages/game-client/src/ui/quest-tracker-target.ts`.
- Large stateful modules are accepted when they encapsulate a subsystem, such as `packages/website/src/routes/editor/-store.ts`, `packages/game-server/src/managers/entity-manager.ts`, and `packages/game-client/src/client-event-listener.ts`.

**Parameters:**
- Prefer explicit typed parameter objects for multi-field operations, especially in data-access and hooks, as in `packages/website/src/routes/editor/-hooks/useEditorApi.ts` and `packages/website/src/data-access/user-stats.ts`.
- Use primitive parameter lists for small helpers and computational functions, such as `getQuestTrackerDistanceTiles` in `packages/game-client/src/ui/quest-tracker-target.ts`.

**Return Values:**
- Return `null` for "not found / no result" outcomes in domain logic, e.g. `resolvePrimaryQuestTracker` and `chooseClosestNpcCandidate` in `packages/game-client/src/ui/quest-tracker-target.ts`.
- Return booleans for validation/predicate APIs such as `recipeCanBeCrafted` in `packages/game-shared/src/util/recipes.ts`.
- Return rich objects for persistence and transport boundaries, such as `SaveWorldMapResponse` in `packages/website/src/routes/editor/-hooks/useEditorApi.ts` and response JSON in `packages/website/src/routes/api/game/player-experience.ts`.

## Module Design

**Exports:**
- Shared and server modules usually use named exports only, as in `packages/game-shared/src/util/recipes.ts`, `packages/game-server/src/events/handlers/set-progression-allocations.ts`, and `packages/website/src/db/index.ts`.
- React route files export `Route` plus local component functions, following TanStack Start conventions in `packages/website/src/routes/sign-in.tsx` and `packages/website/src/routes/api/game/player-experience.ts`.
- Class-based client/server systems export a primary class per file, e.g. `packages/game-client/src/entities/entity-factory.ts` and `packages/game-server/src/managers/entity-manager.ts`.

**Barrel Files:**
- Barrel files are used, but selectively. Examples include `packages/game-client/src/scenes/index.ts`, `packages/game-client/src/ui/panels/index.ts`, and `packages/game-shared/src/map/index.ts`.
- Do not assume every directory has a barrel; many folders are imported directly by file path.

---

*Convention analysis: 2026-04-15*
