import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { useEditorStore } from "../-store";
import {
  isNpcDialogueSpawnTile,
  SPAWN_PALETTE_ENTRIES,
} from "@survive-the-night/game-shared/map/spawn-palette";
import { getMapSideLength, isMapCellInEditorCameraView, parseMapCellAddress } from "../-utils";

const sectionLabel = "text-[10px] font-medium uppercase tracking-wide text-gray-500";

function spawnLabel(id: number): string {
  return SPAWN_PALETTE_ENTRIES.find((e) => e.id === id)?.label ?? `Spawn ${id}`;
}

export function SpawnersListPanel() {
  const spawnsGrid = useEditorStore((state) => state.spawnsGrid);
  const groundGrid = useEditorStore((state) => state.groundGrid);
  const cameraX = useEditorStore((state) => state.cameraX);
  const cameraY = useEditorStore((state) => state.cameraY);
  const viewportWidthTiles = useEditorStore((state) => state.viewportWidthTiles);
  const viewportHeightTiles = useEditorStore((state) => state.viewportHeightTiles);
  const spawnerMeta = useEditorStore((state) => state.spawnerMeta);
  const focusCameraOnMapCell = useEditorStore((state) => state.focusCameraOnMapCell);
  const openSpawnerMetaEditor = useEditorStore((state) => state.openSpawnerMetaEditor);
  const addItemSpawnerAtTile = useEditorStore((state) => state.addItemSpawnerAtTile);
  const [targetRow, setTargetRow] = useState("");
  const [targetCol, setTargetCol] = useState("");
  const [coordinateError, setCoordinateError] = useState<string | null>(null);
  const mapSize = getMapSideLength(groundGrid);

  const entries = useMemo(() => {
    const out: { row: number; col: number; id: number }[] = [];
    for (let row = 0; row < spawnsGrid.length; row++) {
      const r = spawnsGrid[row];
      if (!r) continue;
      for (let col = 0; col < r.length; col++) {
        const id = r[col] ?? 0;
        if (id > 0 && !isNpcDialogueSpawnTile(id)) {
          out.push({ row, col, id });
        }
      }
    }
    out.sort((a, b) => a.row - b.row || a.col - b.col);
    return out;
  }, [spawnsGrid]);

  const { inView, rest } = useMemo(() => {
    const vp = { cameraX, cameraY, viewportWidthTiles, viewportHeightTiles, mapSize };
    const a: typeof entries = [];
    const b: typeof entries = [];
    for (const e of entries) {
      if (isMapCellInEditorCameraView(e.row, e.col, vp)) a.push(e);
      else b.push(e);
    }
    return { inView: a, rest: b };
  }, [entries, groundGrid, cameraX, cameraY, viewportWidthTiles, viewportHeightTiles]);

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
    if (tileId > 0 && !isNpcDialogueSpawnTile(tileId)) {
      openSpawnerMetaEditor(parsed.row, parsed.col);
    } else if (tileId > 0) {
      setCoordinateError("That tile already has a dialogue NPC.");
      return;
    } else {
      addItemSpawnerAtTile(parsed.row, parsed.col);
    }
    focusCameraOnMapCell(parsed.row, parsed.col);
    setCoordinateError(null);
  };

  if (entries.length === 0) {
    return (
      <div className="space-y-2">
        <div className="space-y-1 rounded border border-violet-800/60 bg-gray-900/80 p-2">
          <p className="text-[10px] font-medium text-violet-200">Open or add by coordinates</p>
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
          No spawners (player, zombies, or item fixtures) on the map. Right-click a tile and choose{" "}
          <span className="text-violet-300">Add spawner</span>, or place one here by tile
          coordinates. New coordinate adds use the default spawner tile, then you can edit the
          type.
        </p>
      </div>
    );
  }

  const renderRow = ({ row, col, id }: { row: number; col: number; id: number }) => {
    const authored = spawnerMeta.find((m) => m.row === row && m.col === col)?.name;
    return (
      <li
        key={`${row}-${col}-${id}`}
        className="flex items-center justify-between gap-2 rounded border border-violet-800/60 bg-gray-900/80 px-2 py-1.5"
      >
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => openSpawnerMetaEditor(row, col)}
        >
          <p className="text-[10px] font-medium text-gray-200">
            ({row}, {col})
            {authored ? ` · ${authored}` : ""}
          </p>
          <p className="truncate text-[9px] text-violet-200/90">{spawnLabel(id)}</p>
        </button>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="!h-6 !min-h-0 !px-2 !py-0 !text-[10px]"
            onClick={() => focusCameraOnMapCell(row, col)}
          >
            Go
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="!h-6 !min-h-0 !px-2 !py-0 !text-[10px]"
            onClick={() =>
              useEditorStore.setState({
                activeLayer: "spawns",
                selectedSpawnCell: { row, col },
                selectedTileId: id,
              })
            }
          >
            Select
          </Button>
        </div>
      </li>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="space-y-1 rounded border border-violet-800/60 bg-gray-900/80 p-2">
        <p className="text-[10px] font-medium text-violet-200">Open or add by coordinates</p>
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
        {entries.length} spawner{entries.length === 1 ? "" : "s"} ({inView.length} in view) — Click a
        row (or a spawner tile on the map) to edit the label and relocate.{" "}
        <span className="text-gray-400">Go</span> moves the camera.
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
            <p className="text-[10px] text-gray-600">All spawners are in view.</p>
          ) : (
            <ul className="space-y-1.5">{rest.map(renderRow)}</ul>
          )}
        </div>
      </div>
    </div>
  );
}
