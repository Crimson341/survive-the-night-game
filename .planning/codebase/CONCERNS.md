# Codebase Concerns

**Analysis Date:** 2026-04-15

## Tech Debt

**Committed transpiled artifacts alongside source:**
- Issue: `packages/game-server/src/` contains authored `.ts` files plus generated `.js` and `.d.ts` files in the same tree. The current tree includes 257 `.js` files and 257 `.d.ts` files beside 518 `.ts` files.
- Files: `packages/game-server/src/**/*.ts`, `packages/game-server/src/**/*.js`, `packages/game-server/src/**/*.d.ts`
- Impact: stale generated files can drift from the source, diffs are noisy, and refactors have duplicate edit surfaces.
- Fix approach: emit build output only to `dist/`, remove generated artifacts from `packages/game-server/src/`, and keep runtime/build entrypoints on one canonical output path.

**Large multi-responsibility modules concentrate core logic:**
- Issue: core systems are implemented as very large files with mixed responsibilities.
- Files: `packages/game-server/src/world/map-manager.ts`, `packages/game-server/src/ai/ai-controller.ts`, `packages/website/src/routes/editor/-store.ts`, `packages/website/src/routes/editor/-components/NpcAuthoringPanel.tsx`, `packages/game-client/src/client.ts`
- Impact: changes are high-risk, review cost is high, and regressions are easy to introduce in unrelated behavior.
- Fix approach: split by workflow boundaries such as map loading vs spawning, AI orchestration vs combat, and editor state vs persistence vs undo.

**Cross-package source-path coupling instead of package boundaries:**
- Issue: server code still imports sibling package source files directly with relative paths.
- Files: `packages/game-server/src/world/map-manager.ts`, `packages/game-server/src/events/handlers/disconnect.ts`
- Impact: package boundaries are porous, moves are fragile, and runtime behavior depends on workspace layout.
- Fix approach: route shared contracts through `@survive-the-night/game-shared` exports and remove direct `../../../game-shared/src/...` imports.

**Editor infrastructure mutates source files directly:**
- Issue: the biome editor writes `world-map.json`, sidecar JSON files, and patches `world-config.ts` with regex replacement.
- Files: `packages/biome-editor-server/src/util/world-map-file-handler.ts`, `packages/game-shared/src/config/world-config.ts`, `packages/game-server/src/world/world-map.json`
- Impact: editor behavior is tightly coupled to on-disk source layout and file formatting.
- Fix approach: move world configuration to dedicated data files and isolate writes behind atomic update helpers.

## Known Bugs

**Disconnect cleanup still relies on a race-condition workaround:**
- Symptoms: the preferred deferred-removal path is commented out because it can leave the round in a state where it never restarts.
- Files: `packages/game-server/src/events/handlers/disconnect.ts`
- Trigger: disconnecting a player while relying on deferred entity removal semantics.
- Workaround: `entityManager.removeEntity(playerId)` is called directly instead of `markEntityForRemoval()`.

**Flamethrower ammo can arrive without a required position extension:**
- Symptoms: client rendering previously crashed unless the entity first checked for `ClientPositionable`.
- Files: `packages/game-client/src/entities/weapons/flamethrower-ammo.ts`
- Trigger: rendering a `FlamethrowerAmmoClient` whose serialized payload lacks the expected extension.
- Workaround: `render()` returns early when `this.hasExt(ClientPositionable)` is false.

**Weapon slot resolution still depends on offset-based bag indexing:**
- Symptoms: active item lookup subtracts one from the selected slot index and treats fists as a sentinel.
- Files: `packages/game-server/src/extensions/inventory.ts`
- Trigger: selecting or resolving active inventory items from the loadout state.
- Workaround: the current implementation preserves the 1-based slot contract and special-cases `FISTS_INVENTORY_SENTINEL`.

## Security Considerations

**Game server secrets fall back to predictable defaults:**
- Risk: the server uses hard-coded fallback values for both admin commands and the shared API-signing key.
- Files: `packages/game-server/src/config/env.ts`, `packages/game-server/src/commands/command-registry.ts`, `packages/game-server/src/services/session-validator.ts`, `packages/biome-editor-server/src/util/notify-game-server-map-reload.ts`
- Current mitigation: the website rejects missing `GAME_SERVER_API_KEY` in `packages/website/src/utils/game-server-api-auth.ts`, and the editor reload endpoint checks loopback access in `packages/game-server/src/managers/server-socket-manager.ts`.
- Recommendations: fail fast when `ADMIN_PASSWORD` or `GAME_SERVER_API_KEY` are unset, remove fallback secrets like `default-admin-password` and `abc123`, and require explicit environment configuration in every environment.

**Biome editor API is unauthenticated and fully CORS-open:**
- Risk: development map-edit endpoints accept cross-origin `GET` and `POST` requests with no authentication.
- Files: `packages/biome-editor-server/src/server.ts`, `packages/biome-editor-server/src/api/world-map-routes.ts`
- Current mitigation: `packages/biome-editor-server/src/util/world-map-file-handler.ts` blocks the editor in production mode, but development mode still exposes write endpoints.
- Recommendations: require an editor auth secret even in development, restrict allowed origins, and bind the service to loopback unless explicitly opened.

## Performance Bottlenecks

**Kill tracking does linear player-map scans per kill event:**
- Problem: each zombie kill walks the full player map to find the killer entity and then walks it again to recover the socket ID.
- Files: `packages/game-server/src/services/kill-tracker.ts`
- Cause: `findPlayerByEntityId()` and `findSocketIdByEntityId()` both iterate `playersMap` on every event.
- Improvement path: maintain direct entityId→player and entityId→socket indexes or attach the user/socket identity to the event payload.

**Editor brush and undo operations deep-copy full map layers:**
- Problem: large map edits clone entire grids and snapshot all layers for history.
- Files: `packages/website/src/routes/editor/-store.ts`
- Cause: `fillRectInGrid()` copies every row, and `saveToHistory()` deep-copies `ground`, `collidables`, `spawns`, `decals`, NPCs, decals, spawner metadata, and quests into each snapshot.
- Improvement path: store patch-based undo entries, batch changes by dirty regions, and avoid full-grid copies for brush operations.

**Game loop timing is best-effort only:**
- Problem: the 20 TPS loop is driven by `setInterval()` and only logs when work exceeds the tick budget.
- Files: `packages/game-server/src/core/game-loop.ts`, `packages/game-server/src/util/tick-performance-tracker.ts`, `packages/game-server/src/config/config.ts`
- Cause: overloaded ticks are not rescheduled or back-pressured; the loop just keeps running and reports slow updates after the fact.
- Improvement path: move to a drift-aware scheduler, separate simulation from expensive persistence/broadcast work, and enforce per-tick budgets for optional subsystems.

## Fragile Areas

**World map editing and expansion pipeline:**
- Files: `packages/biome-editor-server/src/util/world-map-file-handler.ts`, `packages/biome-editor-server/src/api/world-map-routes.ts`, `packages/website/src/routes/editor/index.tsx`, `packages/website/src/routes/editor/-hooks/useEditorApi.ts`
- Why fragile: one workflow spans browser state, editor API, direct file writes, sidecar reconciliation, and game-server reload notifications. Map expansion also patches `packages/game-shared/src/config/world-config.ts`, while comments note the running game server still needs a restart to pick up `MAP_SIZE` changes.
- Safe modification: change this path end-to-end, keep sidecar formats synchronized, and verify save, reload, and expand flows together.
- Test coverage: no automated tests were found for `packages/biome-editor-server` or `packages/website/src/routes/editor/**`.

**Entity lifecycle and ID recycling:**
- Files: `packages/game-server/src/managers/entity-manager.ts`, `packages/game-server/src/events/handlers/disconnect.ts`
- Why fragile: entity removal updates multiple tracking structures, ID reuse depends on cleanup staying correct, and the disconnect path already contains a workaround for a round-restart race.
- Safe modification: treat add/remove/prune/disconnect as one system, and verify entity removal, ID reuse, and round restart behavior together.
- Test coverage: no automated tests were found for `packages/game-server/src/managers/**` or `packages/game-server/src/events/handlers/**`.

**Client bootstrapping and UI wiring:**
- Files: `packages/game-client/src/client.ts`, `packages/game-client/src/managers/input.ts`, `packages/game-client/src/ui/hud.ts`
- Why fragile: the client constructor wires many subsystems directly and includes TODO notes to replace callback coupling with an event emitter.
- Safe modification: isolate one subsystem at a time and validate input, HUD, merchant, crafting, and chat interactions together.
- Test coverage: only one client test was found at `packages/game-client/src/ui/quest-tracker-target.test.ts`.

## Scaling Limits

**Entity ID pool:**
- Current capacity: `packages/game-server/src/managers/entity-manager.ts` enforces IDs in the range `0..65535`.
- Limit: `generateEntityId()` throws once active entities reach `maxId + 1`, and it already contains a fallback recovery path when recycled IDs go missing.
- Scaling path: widen the ID space, separate network IDs from in-memory IDs, and add metrics/tests around removal and reuse before increasing the ceiling.

## Dependencies at Risk

**`nitro` alpha release in the website runtime:**
- Risk: `packages/website/package.json` pins `nitro` to `3.0.1-alpha.1`, which carries prerelease runtime/build risk in the main web app.
- Impact: SSR or deployment behavior can change unexpectedly during dependency updates, especially around server functions and output handling.
- Migration plan: pin to a stable Nitro release once compatible with the current TanStack Start stack, then add smoke tests around build/start and critical API routes.

## Missing Critical Features

**No authenticated/editor-role gate around map authoring flows:**
- Problem: map editing depends on the browser editor and `biome-editor-server`, but the write endpoints are not protected by user identity or role checks.
- Blocks: safely exposing editor tooling beyond a fully trusted local environment.

## Test Coverage Gaps

**Server runtime, editor backend, and website APIs are effectively untested:**
- What's not tested: socket/session flows, disconnect cleanup, persistence to website APIs, world-map save/expand routes, and website server-side auth/game endpoints.
- Files: `packages/game-server/src/**`, `packages/biome-editor-server/src/**`, `packages/website/src/routes/api/game/*.ts`, `packages/website/src/fn/game-auth.ts`
- Risk: regressions in persistence, auth, entity cleanup, or editor writes can ship unnoticed.
- Priority: High

**Complex editor state mutations lack regression tests:**
- What's not tested: undo history snapshots, brush operations, NPC/spawner reconciliation, and quest/message decal synchronization.
- Files: `packages/website/src/routes/editor/-store.ts`, `packages/website/src/routes/editor/index.tsx`, `packages/website/src/routes/editor/-components/*.tsx`
- Risk: silent data corruption or broken authoring flows during refactors.
- Priority: High

**AI and map-generation behavior lack safety nets:**
- What's not tested: AI targeting/decision behavior, map generation, authored map application, and spawn reconciliation.
- Files: `packages/game-server/src/ai/*.ts`, `packages/game-server/src/world/map-manager.ts`
- Risk: gameplay regressions can appear only under live simulation load.
- Priority: Medium

---

*Concerns audit: 2026-04-15*
