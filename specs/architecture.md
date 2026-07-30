# Technical Architecture & System Design: nimode

## Tech Stack
- **Framework:** React 18 + Vite (TypeScript Strict Mode)
- **UI & Icons:** Tailwind CSS + Lucide Icons
- **Renderer:** HTML5 Canvas 2D Context
- **Discord Integration:** `@discord/embedded-app-sdk`
- **Spectating Sync:** PeerJS (WebRTC DataChannels with public STUN `stun.l.google.com:19302`)
- **Persistence:** `localStorage` + `idb-keyval` with JSON Schema Validation
- **Testing:** Vitest
- **Hosting / CI:** GitHub Pages via GitHub Actions

---

## High-Level System Architecture

```
+-------------------------------------------------------------------+
|                       Discord Activity Iframe                     |
|                                                                   |
|   +-------------------+                     +-----------------+   |
|   |  React UI Layer   |                     | Canvas 2D View  |   |
|   +---------+---------+                     +--------^--------+   |
|             | (Events/View Toggle)                   | (Render)   |
|   +---------v----------------------------------------+--------+   |
|   |                 View State Controller                     |   |
|   |    [ Active View: LOCAL_GAME  |  SPECTATING_TARGET ]      |   |
|   +---------+----------------------------------------+--------+   |
|             |                                        |            |
|   +---------v--------------+               +---------v--------+   |
|   | Local Game Engine      |               | Spectator Buffer |   |
|   | - Board & Queue        |               | - Remote Board   |   |
|   | - SRS+ & Bag Engine    |               | - Remote Queue   |   |
|   | - Stats & Annotation   |               | - Remote Stats   |   |
|   +---------+--------------+               +---------^--------+   |
|             | (Host Broadcaster)                     | (Stream)   |
|   +---------v--------------+               +---------+--------+   |
|   | WebRTC / PeerJS Host   |               | WebRTC Client    |   |
|   +---------+--------------+               +---------^--------+   |
+-------------|----------------------------------------|------------+
              | (DataChannel P2P)                      |
              +----------------------------------------+
```

---

## Active View Controller State Machine
The UI and Canvas Renderer are managed by a simple state machine:

```
                  ┌───────────────────────────┐
                  │       LOCAL_ACTIVE        │
                  │  (Playing own game engine)│
                  └─────────────┬─────────────┘
                                │
        Select User from Roster │ ▲ Click "Return to My Game"
                                ▼ │
                  ┌───────────────────────────┐
                  │     SPECTATING_TARGET     │
                  │  (Rendering remote P2P)   │
                  └───────────────────────────┘
```

1. **`LOCAL_ACTIVE` Mode:**
   - Canvas renders the player's own game engine (`src/engine/`).
   - Inputs control the local game piece.
   - Host P2P broadcaster sends live state updates to any spectators listening.

2. **`SPECTATING_TARGET` Mode:**
   - Local engine pauses / preserves state in memory.
   - Canvas switches renderer to receive state updates from the target's WebRTC stream.
   - Player can return to `LOCAL_ACTIVE` instantly without state loss.

---

## Modular Strategy Design Interfaces

### 1. Rotation System Interface (`IRotationSystem`)
```typescript
export interface IRotationSystem {
  id: string;
  name: string;
  getInitialState(type: PieceType): PieceState;
  rotate(
    board: BoardMatrix,
    piece: ActivePiece,
    direction: RotationDirection
  ): RotationResult | null;
}
```

### 2. Bag Randomizer Interface (`IBagRandomizer`)
```typescript
export interface IBagRandomizer {
  id: string;
  name: string;
  generateBag(): PieceType[];
}
```

---

## Instance Privacy Model
Each participant in a Discord Activity session has an `InstanceConfig` that controls visibility:

```typescript
export interface InstanceConfig {
  isPrivate: boolean;
}
```

- **Public (default):** The host broadcaster actively sends state deltas (20 Hz) to all spectators. The participant appears selectable in the Presence Roster.
- **Private:** The host broadcaster is **silent** — no `SpectatorPayload` is transmitted. The participant appears in the Presence Roster with a "Private" badge and cannot be selected for spectating.

Privacy state is stored locally via `localStorage` and is **not** gossiped via WebRTC (it is part of the presence metadata distributed through the signaling channel).

### Active View Controller State Machine (Updated)
The machine gains a guard condition: selecting a target from the roster must check `target.isPrivate`; if `true`, the transition is blocked and the roster shows a disabled/private indicator.

## Spectating Data Serialization Protocol
The host serializes game state at 20 Hz over WebRTC (only when `isPrivate === false`):
```typescript
export interface SpectatorPayload {
  userId: string;
  matrix: number[][];
  activePiece: { type: number; x: number; y: number; r: number } | null;
  queue: number[];
  hold: number | null;
  annotations: number[][];
  stats: {
    pps: number;
    apm: number;
    kpp: number;
    piecesPlaced: number;
    linesCleared: number;
  };
}
```