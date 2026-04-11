import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { useEditorStore } from "../-store";
import type { WorldMapDialogueNpcEntry } from "@survive-the-night/game-shared/map/world-map-types";
import { getDialogueNpcLines } from "@survive-the-night/game-shared/map/world-map-types";
import { isNpcDialogueSpawnTile } from "@survive-the-night/game-shared/map/spawn-palette";
import { getMapSideLength, isMapCellInEditorCameraView, parseMapCellAddress } from "../-utils";

const sectionLabel = "text-[10px] font-medium uppercase tracking-wide text-gray-500";

export function NpcsListPanel() {
  const dialogueNpcs = useEditorStore((state) => state.dialogueNpcs);
  const spawnsGrid = useEditorStore((state) => state.spawnsGrid);
  const groundGrid = useEditorStore((state) => state.groundGrid);
  const cameraX = useEditorStore((state) => state.cameraX);
  const cameraY = useEditorStore((state) => state.cameraY);
  const viewportWidthTiles = useEditorStore((state) => state.viewportWidthTiles);
  const viewportHeightTiles = useEditorStore((state) => state.viewportHeightTiles);
  const removeDialogueNpcAt = useEditorStore((state) => state.removeDialogueNpcAt);
  const openDialogueNpcEditor = useEditorStore((state) => state.openDialogueNpcEditor);
  const focusCameraOnMapCell = useEditorStore((state) => state.focusCameraOnMapCell);
  const addDialogueNpcAtTile = useEditorStore((state) => state.addDialogueNpcAtTile);
  const [targetRow, setTargetRow] = useState("");
  const [targetCol, setTargetCol] = useState("");
  const [coordinateError, setCoordinateError] = useState<string | null>(null);
  const mapSize = getMapSideLength(groundGrid);

  const sorted = useMemo(
    () => [...dialogueNpcs].sort((a, b) => a.row - b.row || a.col - b.col),
    [dialogueNpcs],
  );

  const { inView, rest } = useMemo(() => {
    const vp = { cameraX, cameraY, viewportWidthTiles, viewportHeightTiles, mapSize };
    const a: WorldMapDialogueNpcEntry[] = [];
    const b: WorldMapDialogueNpcEntry[] = [];
    for (const entry of sorted) {
      if (isMapCellInEditorCameraView(entry.row, entry.col, vp)) a.push(entry);
      else b.push(entry);
    }
    return { inView: a, rest: b };
  }, [sorted, groundGrid, cameraX, cameraY, viewportWidthTiles, viewportHeightTiles]);

  const parseTargetCell = () => parseMapCellAddress(targetRow, targetCol, mapSize);

  const handleGoToTarget = () => {
    const parsed = parseTargetCell();
    if ("error" in parsed) {
      setCoordinateError(parsed.error);
      return;
    }
    focusCameraOnMapCell(parsed.row, parsed.col);
    setCoordinateError(null);
  };

  const handleAddOrOpenAtTarget = () => {
    const parsed = parseTargetCell();
    if ("error" in parsed) {
      setCoordinateError(parsed.error);
      return;
    }
    const tileId = spawnsGrid[parsed.row]?.[parsed.col] ?? 0;
    if (isNpcDialogueSpawnTile(tileId)) {
      openDialogueNpcEditor(parsed.row, parsed.col);
    } else if (tileId > 0) {
      setCoordinateError("That tile already has a non-NPC spawner.");
      return;
    } else {
      addDialogueNpcAtTile(parsed.row, parsed.col);
    }
    focusCameraOnMapCell(parsed.row, parsed.col);
    setCoordinateError(null);
  };

  if (sorted.length === 0) {
    return (
      <div className="space-y-2">
        <div className="space-y-1 rounded border border-emerald-800/60 bg-gray-900/80 p-2">
          <p className="text-[10px] font-medium text-emerald-200">Open or add by coordinates</p>
          <div className="grid grid-cols-2 gap-1">
            <input
              type="number"
              min={0}
              max={Math.max(0, mapSize - 1)}
              className="w-full rounded border border-gray-600 bg-gray-950 px-2 py-1 text-[11px] text-gray-100"
              value={targetRow}
              onChange={(e) => setTargetRow(e.target.value)}
              placeholder="row"
            />
            <input
              type="number"
              min={0}
              max={Math.max(0, mapSize - 1)}
              className="w-full rounded border border-gray-600 bg-gray-950 px-2 py-1 text-[11px] text-gray-100"
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
              placeholder="col"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="!h-6 !min-h-0 !px-2 !py-0 !text-[10px]"
              onClick={handleGoToTarget}
            >
              Go
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="!h-6 !min-h-0 !px-2 !py-0 !text-[10px]"
              onClick={handleAddOrOpenAtTarget}
            >
              Add / Open
            </Button>
          </div>
          <p className={`text-[9px] ${coordinateError ? "text-amber-300" : "text-gray-500"}`}>
            {coordinateError ?? `Map bounds: 0-${Math.max(0, mapSize - 1)}.`}
          </p>
        </div>
        <p className="text-[10px] text-gray-500">
          No dialogue NPCs yet. Right-click the map and choose{" "}
          <span className="text-emerald-300">Add NPC</span>, or add one directly by tile
          coordinates here.
        </p>
      </div>
    );
  }

  const renderRow = (entry: WorldMapDialogueNpcEntry) => {
    const preview = getDialogueNpcLines(entry)[0]?.slice(0, 100) ?? "";
    return (
      <li
        key={`${entry.row}-${entry.col}`}
        className="flex items-start justify-between gap-2 rounded border border-emerald-800/60 bg-gray-900/80 px-2 py-1.5"
      >
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => openDialogueNpcEditor(entry.row, entry.col)}
        >
          <p className="text-[10px] font-medium text-gray-200">
            ({entry.row}, {entry.col})
            {entry.name ? ` · ${entry.name}` : ""}
          </p>
          <p className="truncate text-[9px] text-gray-500">{preview || "…"}</p>
        </button>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="!h-6 !min-h-0 !px-2 !py-0 !text-[10px]"
            onClick={() => focusCameraOnMapCell(entry.row, entry.col)}
          >
            Go
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="!h-6 !min-h-0 !px-2 !py-0 !text-[10px]"
            onClick={() => removeDialogueNpcAt(entry.row, entry.col)}
          >
            Remove
          </Button>
        </div>
      </li>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="space-y-1 rounded border border-emerald-800/60 bg-gray-900/80 p-2">
        <p className="text-[10px] font-medium text-emerald-200">Open or add by coordinates</p>
        <div className="grid grid-cols-2 gap-1">
          <input
            type="number"
            min={0}
            max={Math.max(0, mapSize - 1)}
            className="w-full rounded border border-gray-600 bg-gray-950 px-2 py-1 text-[11px] text-gray-100"
            value={targetRow}
            onChange={(e) => setTargetRow(e.target.value)}
            placeholder="row"
          />
          <input
            type="number"
            min={0}
            max={Math.max(0, mapSize - 1)}
            className="w-full rounded border border-gray-600 bg-gray-950 px-2 py-1 text-[11px] text-gray-100"
            value={targetCol}
            onChange={(e) => setTargetCol(e.target.value)}
            placeholder="col"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="!h-6 !min-h-0 !px-2 !py-0 !text-[10px]"
            onClick={handleGoToTarget}
          >
            Go
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="!h-6 !min-h-0 !px-2 !py-0 !text-[10px]"
            onClick={handleAddOrOpenAtTarget}
          >
            Add / Open
          </Button>
        </div>
        <p className={`text-[9px] ${coordinateError ? "text-amber-300" : "text-gray-500"}`}>
          {coordinateError ?? `Map bounds: 0-${Math.max(0, mapSize - 1)}.`}
        </p>
      </div>
      <p className="text-[10px] text-gray-500">
        {sorted.length} NPC{sorted.length === 1 ? "" : "s"} ({inView.length} in view) — click a row
        to edit. <span className="text-gray-400">Go</span> moves the camera.
      </p>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <div>
          <p className={`${sectionLabel} mb-1`}>In view</p>
          {inView.length === 0 ? (
            <p className="text-[10px] text-gray-600">None in current view.</p>
          ) : (
            <ul className="space-y-1.5">{inView.map(renderRow)}</ul>
          )}
        </div>
        <div>
          <p className={`${sectionLabel} mb-1`}>Rest of map</p>
          {rest.length === 0 ? (
            <p className="text-[10px] text-gray-600">All NPCs are in view.</p>
          ) : (
            <ul className="space-y-1.5">{rest.map(renderRow)}</ul>
          )}
        </div>
      </div>
    </div>
  );
}
