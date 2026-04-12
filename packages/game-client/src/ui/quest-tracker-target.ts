import type { WorldMapQuestDefinition } from "../../../game-shared/src/map/quest-types";
import { getConfig } from "../../../game-shared/src/config";
import { getQuestObjectiveLine } from "./quest-display";

export type QuestTrackerTargetKind = "waypoint" | "talk_to_npc" | "turn_in";

export interface QuestTrackerNpcCandidate {
  displayName: string;
  npcKey: string;
  worldX: number;
  worldY: number;
  completesQuestId?: string;
}

export interface QuestTrackerTarget {
  kind: QuestTrackerTargetKind;
  label: string;
  worldX: number;
  worldY: number;
  tileRow: number;
  tileCol: number;
}

export interface QuestTrackerResolution {
  questId: string;
  title: string;
  objective: string;
  stepIndex: number;
  stepTotal: number;
  extraQuestCount: number;
  target: QuestTrackerTarget | null;
}

type QuestTrackerActiveEntryLike = {
  step?: unknown;
  kills?: Record<string, number>;
} | number;

type QuestTrackerProgressLike = {
  active: Record<string, QuestTrackerActiveEntryLike>;
  completed: string[];
};

export interface QuestTrackerHeading {
  angle: number;
  cardinal: string;
  glyph: string;
}

const QUEST_TRACKER_HEADINGS: ReadonlyArray<QuestTrackerHeading> = [
  { angle: 0, cardinal: "E", glyph: "→" },
  { angle: Math.PI / 4, cardinal: "SE", glyph: "↘" },
  { angle: Math.PI / 2, cardinal: "S", glyph: "↓" },
  { angle: (3 * Math.PI) / 4, cardinal: "SW", glyph: "↙" },
  { angle: Math.PI, cardinal: "W", glyph: "←" },
  { angle: (5 * Math.PI) / 4, cardinal: "NW", glyph: "↖" },
  { angle: (3 * Math.PI) / 2, cardinal: "N", glyph: "↑" },
  { angle: (7 * Math.PI) / 4, cardinal: "NE", glyph: "↗" },
];

function parseNpcKeyToTile(npcKey: string): { row: number; col: number } | null {
  const trimmed = npcKey.trim();
  if (!trimmed) return null;
  const [rowRaw, colRaw] = trimmed.split(",");
  const row = Number.parseInt(rowRaw ?? "", 10);
  const col = Number.parseInt(colRaw ?? "", 10);
  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    return null;
  }
  return { row, col };
}

function talkToNpcStepMatches(
  step: { npcName?: string; npcKey?: string },
  npcDisplayName: string,
  npcKey: string,
): boolean {
  const wantName = step.npcName?.trim() ?? "";
  const wantKey = step.npcKey?.trim() ?? "";
  const gotName = npcDisplayName.trim();
  const gotKey = npcKey.trim();
  if (wantName && wantKey) {
    return gotName === wantName && gotKey === wantKey;
  }
  if (wantKey) return gotKey === wantKey;
  if (wantName) return gotName === wantName;
  return false;
}

function getActiveStepIndex(st: QuestTrackerProgressLike, qid: string): number {
  const raw = st.active[qid];
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0) {
    return raw;
  }
  if (raw && typeof raw === "object" && typeof raw.step === "number" && Number.isInteger(raw.step)) {
    return Math.max(0, raw.step);
  }
  return 0;
}

function worldToTile(worldX: number, worldY: number): { row: number; col: number } {
  const tileSize = getConfig().world.TILE_SIZE;
  return {
    row: Math.floor(worldY / tileSize),
    col: Math.floor(worldX / tileSize),
  };
}

function tileToWorld(row: number, col: number): { worldX: number; worldY: number } {
  const tileSize = getConfig().world.TILE_SIZE;
  return {
    worldX: col * tileSize + tileSize / 2,
    worldY: row * tileSize + tileSize / 2,
  };
}

function createTarget(
  kind: QuestTrackerTargetKind,
  label: string,
  worldX: number,
  worldY: number,
  tileHint?: { row: number; col: number } | null,
): QuestTrackerTarget {
  const tile = tileHint ?? worldToTile(worldX, worldY);
  return {
    kind,
    label,
    worldX,
    worldY,
    tileRow: tile.row,
    tileCol: tile.col,
  };
}

function chooseClosestNpcCandidate(
  candidates: readonly QuestTrackerNpcCandidate[],
  playerWorldX: number,
  playerWorldY: number,
): QuestTrackerNpcCandidate | null {
  if (candidates.length === 0) return null;
  let best: QuestTrackerNpcCandidate | null = null;
  let bestDistSq = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const dx = candidate.worldX - playerWorldX;
    const dy = candidate.worldY - playerWorldY;
    const distSq = dx * dx + dy * dy;
    if (distSq < bestDistSq) {
      best = candidate;
      bestDistSq = distSq;
    }
  }
  return best;
}

function resolveTalkToNpcTarget(
  step: { npcName?: string; npcKey?: string },
  candidates: readonly QuestTrackerNpcCandidate[],
  playerWorldX: number,
  playerWorldY: number,
): QuestTrackerTarget | null {
  const matches = candidates.filter((candidate) =>
    talkToNpcStepMatches(step, candidate.displayName, candidate.npcKey),
  );
  const nearest = chooseClosestNpcCandidate(matches, playerWorldX, playerWorldY);
  if (nearest) {
    return createTarget(
      "talk_to_npc",
      nearest.displayName.trim() || "Survivor",
      nearest.worldX,
      nearest.worldY,
      parseNpcKeyToTile(nearest.npcKey),
    );
  }

  const fallbackTile = step.npcKey ? parseNpcKeyToTile(step.npcKey) : null;
  if (fallbackTile) {
    const world = tileToWorld(fallbackTile.row, fallbackTile.col);
    return createTarget(
      "talk_to_npc",
      step.npcName?.trim() || "Survivor",
      world.worldX,
      world.worldY,
      fallbackTile,
    );
  }

  return null;
}

function resolveTurnInTarget(
  questId: string,
  candidates: readonly QuestTrackerNpcCandidate[],
  playerWorldX: number,
  playerWorldY: number,
): QuestTrackerTarget | null {
  const turnInCandidates = candidates.filter((candidate) => candidate.completesQuestId === questId);
  const nearest = chooseClosestNpcCandidate(turnInCandidates, playerWorldX, playerWorldY);
  if (!nearest) return null;
  return createTarget(
    "turn_in",
    nearest.displayName.trim() || "Survivor",
    nearest.worldX,
    nearest.worldY,
    parseNpcKeyToTile(nearest.npcKey),
  );
}

export function resolvePrimaryQuestTracker(
  quests: readonly WorldMapQuestDefinition[],
  progress: QuestTrackerProgressLike | null,
  playerWorldX: number,
  playerWorldY: number,
  npcCandidates: readonly QuestTrackerNpcCandidate[],
): QuestTrackerResolution | null {
  const state = progress ?? { active: {}, completed: [] };
  const activeIds = Object.keys(state.active);
  if (activeIds.length === 0) {
    return null;
  }

  const questId = activeIds[0]!;
  const def = quests.find((quest) => quest.id === questId);
  const stepIndex = getActiveStepIndex(state, questId);
  const stepTotal = def?.steps.length ?? 0;

  let target: QuestTrackerTarget | null = null;
  if (def) {
    if (stepIndex >= stepTotal || stepTotal === 0) {
      target = resolveTurnInTarget(questId, npcCandidates, playerWorldX, playerWorldY);
    } else {
      const step = def.steps[stepIndex];
      switch (step?.type) {
        case "reach_waypoint": {
          const world = tileToWorld(step.row, step.col);
          target = createTarget("waypoint", "Waypoint", world.worldX, world.worldY, {
            row: step.row,
            col: step.col,
          });
          break;
        }
        case "talk_to_npc":
          target = resolveTalkToNpcTarget(step, npcCandidates, playerWorldX, playerWorldY);
          break;
        default:
          target = null;
      }
    }
  }

  return {
    questId,
    title: def?.title?.trim() || questId,
    objective: getQuestObjectiveLine(def, state, questId),
    stepIndex,
    stepTotal,
    extraQuestCount: Math.max(0, activeIds.length - 1),
    target,
  };
}

export function getQuestTrackerHeading(
  playerWorldX: number,
  playerWorldY: number,
  targetWorldX: number,
  targetWorldY: number,
): QuestTrackerHeading {
  const dx = targetWorldX - playerWorldX;
  const dy = targetWorldY - playerWorldY;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
    return { angle: 0, cardinal: "HERE", glyph: "•" };
  }
  const rawAngle = Math.atan2(dy, dx);
  const normalized = rawAngle < 0 ? rawAngle + Math.PI * 2 : rawAngle;
  const index = Math.round(normalized / (Math.PI / 4)) % QUEST_TRACKER_HEADINGS.length;
  return QUEST_TRACKER_HEADINGS[index]!;
}

export function getQuestTrackerDistanceTiles(
  playerWorldX: number,
  playerWorldY: number,
  targetWorldX: number,
  targetWorldY: number,
): number {
  const dx = targetWorldX - playerWorldX;
  const dy = targetWorldY - playerWorldY;
  return Math.sqrt(dx * dx + dy * dy) / getConfig().world.TILE_SIZE;
}
