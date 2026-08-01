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

- **Public (default):** The host broadcaster actively sends state deltas at 50 Hz (20 ms interval) to all spectators; the spectator interpolates against a 20 ms render-time offset (typical end-to-end latency <50 ms). The participant appears selectable in the Presence Roster.
- **Private:** The host broadcaster is **silent** — no `SpectatorPayload` is transmitted. The participant appears in the Presence Roster with a "Private" badge and cannot be selected for spectating.

Privacy state is stored locally via `localStorage` and is **not** gossiped via WebRTC (it is part of the presence metadata distributed through the signaling channel).

### Active View Controller State Machine (Updated)
The machine gains a guard condition: selecting a target from the roster must check `target.isPrivate`; if `true`, the transition is blocked and the roster shows a disabled/private indicator.

## Spectating Data Serialization Protocol
The host serializes game state at 50 Hz (every 20 ms) over WebRTC (only when `isPrivate === false`):
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

## Gravity & Subzero Configuration
`GameConfig` extends with `gravity` (guideline G level, default `1`) and `subzero` (boolean, default `false`):
- `gravity`: `0G` floats the piece (soft drop only); `20G` drops the piece instantly to its landing position.
- `subzero`: disables lock-on-contact; a grounded piece locks **only** on hard drop.

`EngineCore.applyGravity` (`src/engine/EngineCore.ts:91`) consumes `config.gravity` instead of the hardcoded `1000/60` rate, and lock-on-contact is gated by `config.subzero`.

---

## Coordinate & Rotation Conventions

The board matrix is **Y-down**: row `0` is the top of the matrix, and `y + 1` moves a piece *down* the screen. Every renderer, collision check and gravity step assumes this.

Consequently `rotateMatrix` (`src/engine/systems/SrsPlusRotationSystem.ts`) maps `result[x][n-1-y] = matrix[y][x]`, which moves a cell at the **top** to the **right** — a visually clockwise turn. Rotation state advances `R0 → R1 → R2 → R3` clockwise, so the T-piece nub travels top → right → bottom → left. `rotate(piece, 1)` is clockwise and `rotate(piece, -1)` is counter-clockwise.

`src/engine/__tests__/rotationDirection.test.ts` pins this visual direction so it cannot silently invert.

> **Known deviation:** the SRS+ kick tables in `srsPlusKicks.ts` are transcribed in the classic **Y-up** notation, so a kick's `+y` currently displaces a piece *downward*. This only affects obstructed rotations, and the values are asserted explicitly across `srsPlusKicks.test.ts`. Correcting the sign convention is tracked separately from the rotation-direction work.

---

## Keybinding Model

Bindings are **canonical binding codes** (`src/engine/keybindingCodes.ts`): a key code optionally prefixed by modifiers in a fixed `Ctrl`, `Shift`, `Alt` order — `KeyZ`, `Ctrl+KeyZ`, `Ctrl+Shift+KeyZ`. A single canonical form per combination lets bindings be compared by string equality.

- `eventToBindingCode` serialises a `KeyboardEvent`; it folds **Meta (Cmd) into Ctrl** so one binding works across macOS and Windows, and returns `null` for bare modifier presses.
- `KeybindingsStore.resolveAction` matches on the whole combination, so `Ctrl+Z` (undo) and a bare `Z` (rotate CCW) remain distinct.
- `KeyboardInputAdapter` calls `preventDefault()` on any bound key, so in-game shortcuts win over the browser's (`Ctrl+Z`, `Space`, arrow-key scrolling).
- `formatBinding` renders a display label (`Ctrl+KeyZ` → `Ctrl + Z`).

Defaults follow the standard Tetris layout: `Z` = CCW, `X` = CW, `C` = Hold, `Space` = Hard Drop, `Ctrl+Z` / `Ctrl+Y` = Undo / Redo.

---

## Annotation Model

Annotation cells store either a **tetromino type (`1..7`)** or the neutral marker `ANNOTATION_PLAIN` (`8`), defined in `src/render/annotationColors.ts`. Freshly drawn cells always carry the neutral marker; only auto-color promotes cells to a real piece type. `resolveAnnotationColor` renders piece-typed cells in their tetromino colour and neutral cells in the player's picked colour, defaulting to white.

### Stroke-scoped auto-color
A global flood fill merges a newly drawn piece with any annotation it touches, producing an oversized component that no longer matches a tetromino. Auto-color is therefore scoped to the **current stroke**:

1. `useAnnotationStroke` (`src/components/canvas/useAnnotationStroke.ts`) accumulates the cells painted during one continuous drag in a ref, so mid-stroke updates never trigger a re-render.
2. On stroke end, `GameCanvas` dispatches `ANNOTATE_AUTO_COLOR_STROKE` with those cells.
3. `autoColorStroke` (`src/engine/autoColorEngine.ts`) matches the stroke's own geometry via `matchTetromino`, ignoring cells erased mid-stroke and duplicates from overlapping pointer moves.

`autoColorAnnotations` (whole-board flood fill) is retained for the explicit "auto-color everything" action. Shape matching is shared through `src/engine/autoColorShapes.ts`.

### Pointer tools
The **right mouse button erases regardless of the selected tool**. The erase mode is latched on press (`BoardInputHandler`) because `mousemove` does not report which button is held, so an entire right-drag keeps erasing. The board suppresses the context menu. Right-drag erasing never contributes cells to the auto-color stroke.

---

## Rendering & Layout

### Crispness
`setupHiDpiCanvas` (`src/components/canvas/canvasScaling.ts`) sizes each canvas backing store by `devicePixelRatio`, scales the context back down so drawing code stays in logical pixels, and disables image smoothing. Single-pixel strokes are placed on half-pixel centres via `crisp()` (`src/render/renderConstants.ts`) so they map onto exactly one device pixel instead of straddling two.

### Ghost piece
The landing indicator is a **thick white outline** (`GHOST_COLOR`, `GHOST_LINE_WIDTH`), drawn fully opaque and inset by half its line width, rather than a translucent tint of the piece colour.

### Responsive playfield
`useBoardScale` (`src/components/canvas/useBoardScale.ts`) observes the board container via `ResizeObserver` (falling back to a `resize` listener) and returns the largest whole-pixel cell size that fits, clamped to `MIN_CELL_SIZE`..`MAX_CELL_SIZE`. Integral cell sizes keep every cell edge on a pixel boundary.

### Layout
```
+----------------------------------------------------------+
|  [status]                                    [✏] [⚙]     |  <- floating, no navbar
|                                                          |
|  +---------+      +------------------+      +---------+  |
|  |  STATS  |      |                  |      |  NEXT   |  |
|  |  (left) |      |      BOARD       |      |  HOLD   |  |
|  |         |      |   (fits view)    |      | (right) |  |
|  +---------+      +------------------+      +---------+  |
|                                                          |
|                                            [roster]      |
+----------------------------------------------------------+
```
`App.tsx` owns a fixed, non-scrolling `h-screen w-screen` shell. `FloatingControls` replaces the removed `AppHeader`; the presence roster and P2P error float over the corners. `ActiveView` selects between the local game and the spectated board.