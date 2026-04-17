# Class Player Sprites Design

Date: 2026-04-17

## Goal

Give the three playable classes (`survivor`, `scavenger`, `medic`) their own full in-game animated sprite sets and make the chosen class authoritative so every connected client sees the same appearance.

## Current State

- The class picker stores `selectedClass` in browser storage and sends it during the game connection handshake.
- The server ignores `selectedClass` today.
- Human players always render from the same `player` or `player_wdc` character rows.
- Character frame generation already supports multiple character definitions from the shared `characters-sheet.png`.

## Requirements

- Add three authored sprite sets with walk frames for up, down, left, and right.
- Keep the existing sheet format and client asset loader model.
- Replicate class choice through server-owned serialized player state.
- Preserve current zombie override behavior.
- Keep existing player color tint support working for human classes.

## Chosen Approach

Extend the existing `packages/website/public/sheets/characters-sheet.png` with three new sprite blocks and register them as first-class player character configs.

On connect, the server will read the client-selected class from the socket handshake, validate it against the supported set, and store it on the `Player` serialized state. That field will flow to all clients through the existing entity serialization path. The client player renderer will select the correct class asset prefix from serialized state unless the player is zombified, in which case zombie art still wins.

## Design

### Asset Layout

- Keep using `characters-sheet.png`.
- Add new frame rows for:
  - `player_survivor`
  - `player_scavenger`
  - `player_medic`
- Match the current 16x16 tile size and 3-frame directional walk layout already used by `player`.
- Reuse the same dead-frame behavior as current human player configs unless new dedicated dead frames are added during implementation.

### Shared Data Model

- Add a serialized player field for class id, using a small validated string field.
- Introduce a shared class id type/constant set so client and server validate the same values.
- Default invalid or missing values to `survivor`.

### Server Flow

- Read `selectedClass` from socket handshake in `ServerSocketManager`.
- Persist the validated class choice for the socket during connection setup.
- Apply the stored class to the created `Player`.
- Include the class id in serialized player state so all clients receive it automatically.

### Client Flow

- Read the serialized player class field in `PlayerClient`.
- Resolve the rendered asset key from class id plus optional player color.
- Preserve existing special cases:
  - zombie players use zombie art
  - WDC skin still maps to its own asset when relevant

### Testing

- Add or update targeted tests for class asset key resolution and class validation/defaulting.
- Rebuild the docker stack and verify `/play` renders distinct class sprites in-game.

## Non-Goals

- Reworking class gameplay balance or stats.
- Adding equipment-layer rendering.
- Changing the sprite loader architecture beyond what is needed for class-specific human bodies.
