# Testing Patterns

**Analysis Date:** 2026-04-15

## Test Framework

**Runner:**
- Vitest 2.1.8
- Config: `packages/game-client/vitest.config.ts`, `packages/game-server/vitest.config.ts`, `packages/game-shared/vitest.config.ts`

**Assertion Library:**
- Vitest built-ins via `expect`, imported directly in files like `packages/game-client/src/ui/quest-tracker-target.test.ts` and `packages/game-shared/src/util/recipes.test.ts`.

**Run Commands:**
```bash
npm run test --workspace=packages/game-client     # Run game-client tests in watch/default Vitest mode
npm run test --workspace=packages/game-server     # Run game-server tests in watch/default Vitest mode
npm run test --workspace=packages/game-shared     # Run game-shared tests once
```

## Test File Organization

**Location:**
- Tests are co-located with implementation files.
- Current coverage is concentrated in `packages/game-shared/src/**/*.test.ts` and one client test at `packages/game-client/src/ui/quest-tracker-target.test.ts`.
- No test files were detected in `packages/website/src/` or `packages/game-server/src/`.

**Naming:**
- Use `*.test.ts` beside the target module, such as `packages/game-shared/src/util/recipes.test.ts` next to `packages/game-shared/src/util/recipes.ts`.

**Structure:**
```
packages/game-shared/src/**/<module>.test.ts
packages/game-client/src/**/<module>.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from "vitest";
import { resolvePrimaryQuestTracker } from "./quest-tracker-target";

describe("quest-tracker-target", () => {
  it("resolves waypoint targets from quest steps", () => {
    const resolution = resolvePrimaryQuestTracker(quests, activeProgress(0), 0, 0, []);
    expect(resolution?.target).toMatchObject({ kind: "waypoint", tileRow: 10, tileCol: 5 });
  });
});
```
- Pattern taken from `packages/game-client/src/ui/quest-tracker-target.test.ts`.

**Patterns:**
- Create tiny local factories/builders at the top of the test file, like `activeProgress` in `packages/game-client/src/ui/quest-tracker-target.test.ts`, `st` and `all` in `packages/game-shared/src/map/world-map-dialogue-npc.test.ts`, and `miniQuest` in `packages/game-shared/src/quests/player-quest-state.test.ts`.
- Group assertions by public behavior instead of mirroring internal functions 1:1.
- Use descriptive `it(...)` names that read like requirements, especially in `packages/game-shared/src/map/world-map-dialogue-npc.test.ts` and `packages/game-shared/src/quests/player-quest-state.test.ts`.

## Mocking

**Framework:** Vitest, but no explicit mocks detected

**Patterns:**
```typescript
const ctx = {
  getQuestDefinition: (id: string) => (id === "q1" ? def : undefined),
  dialogueNpc: { displayName: "Rick", npcKey: "126,122" },
};

expect(pickDialogueNpcSession(sessions, onFinalTalk, () => false, ctx).lines[0]).toBe("finale");
```
- Pattern taken from `packages/game-shared/src/map/world-map-dialogue-npc.test.ts`.
- Tests use plain objects, inline callbacks, and small hand-built fixtures instead of `vi.mock`, `vi.spyOn`, or module replacement.

**What to Mock:**
- Prefer lightweight inline collaborators and function arguments when a function accepts callbacks or context objects, as in `packages/game-shared/src/map/world-map-dialogue-npc.test.ts`.
- Prefer authoring minimal input payloads directly rather than mocking registries or frameworks, as in `packages/game-shared/src/util/recipes.test.ts` and `packages/game-shared/src/quests/player-quest-state.test.ts`.

**What NOT to Mock:**
- Do not introduce module-level mocks for pure shared utilities; current tests exercise real implementations in `packages/game-shared/src/util/*.ts` and `packages/game-shared/src/map/*.ts`.
- Do not rely on fake timers or lifecycle-heavy harnesses; none are present in the current suite.

## Fixtures and Factories

**Test Data:**
```typescript
const miniQuest = (steps: WorldMapQuestDefinition["steps"]): WorldMapQuestDefinition => ({
  id: "q",
  title: "t",
  steps,
  rewards: [],
  startRewards: [],
});
```
- Pattern taken from `packages/game-shared/src/quests/player-quest-state.test.ts`.

**Location:**
- Fixtures stay inside each test file rather than in shared fixture directories.
- Representative examples: `packages/game-client/src/ui/quest-tracker-target.test.ts`, `packages/game-shared/src/map/world-map-dialogue-npc.test.ts`, and `packages/game-shared/src/quests/player-quest-state.test.ts`.

## Coverage

**Requirements:** None enforced
- No coverage script or coverage config was detected in `package.json`, `packages/*/package.json`, or `packages/*/vitest.config.ts`.
- No coverage thresholds or reporters were detected.

**View Coverage:**
```bash
Not configured in repository scripts
```

## Test Types

**Unit Tests:**
- This repo currently favors pure unit tests around deterministic logic in `packages/game-shared/src/util/*.test.ts`, `packages/game-shared/src/map/*.test.ts`, `packages/game-shared/src/quests/*.test.ts`, and `packages/game-client/src/ui/quest-tracker-target.test.ts`.
- Tests validate normalization, serialization, mapping logic, and quest-state calculations with direct function calls.

**Integration Tests:**
- Not detected.
- There are no test files exercising HTTP routes in `packages/website/src/routes/api/` or socket/game-server flows in `packages/game-server/src/`.

**E2E Tests:**
- Not used.

## Common Patterns

**Async Testing:**
```typescript
No async/await test pattern was detected in the current test files.
Current tests are synchronous and call pure functions directly.
```

**Error Testing:**
```typescript
expect(normalizeActiveEntry(-1)).toBeNull();
expect(normalizeActiveEntry("x")).toBeNull();
expect(normalizeActiveEntry({})).toBeNull();
```
- Pattern taken from `packages/game-shared/src/quests/player-quest-state.test.ts`.

## Package-Specific Notes

**`packages/game-shared`:**
- `packages/game-shared/vitest.config.ts` uses `globals: false`, `environment: "node"`, and `include: ["src/**/*.test.ts"]`.
- Import `describe`, `expect`, and `it` explicitly in every test file.
- This package contains the bulk of the test suite, including `packages/game-shared/src/map/world-map-dialogue-npc.test.ts`, `packages/game-shared/src/map/world-map-sidecars.test.ts`, `packages/game-shared/src/util/recipes.test.ts`, and `packages/game-shared/src/entities/gun-pack-configs.test.ts`.

**`packages/game-client`:**
- `packages/game-client/vitest.config.ts` uses `globals: true` and `environment: "node"`, but the existing test file `packages/game-client/src/ui/quest-tracker-target.test.ts` still imports Vitest helpers explicitly.
- Keep client tests pure and detached from DOM/canvas runtime unless a dedicated harness is added.

**`packages/game-server`:**
- `packages/game-server/vitest.config.ts` is present with `globals: true` and `environment: "node"`.
- No current `*.test.ts` files were detected under `packages/game-server/src/`, so new server tests should establish the first local pattern by following shared/client co-location.

**`packages/website`:**
- No Vitest/Jest config or `*.test.*` files were detected under `packages/website/`.
- New website tests would need new tooling or a package-local convention; no existing pattern is available to copy.

## Absent Patterns Worth Preserving

- No `beforeEach`, `afterEach`, `beforeAll`, or `afterAll` hooks were detected in repo tests.
- No `vi.mock`, `vi.fn`, or `vi.spyOn` usage was detected in repo tests.
- No snapshot tests were detected.
- No DOM/browser test environment was detected; all configs use `environment: "node"`.

---

*Testing analysis: 2026-04-15*
