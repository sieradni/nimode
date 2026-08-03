# Work Breakdown Checklist: nimode

## Phase 1: Foundation & Scaffold
- [x] **T-1.1:** Initialize Vite React TypeScript project with Tailwind CSS.
- [x] **T-1.2:** Configure `package.json`, ESLint strict rules, Vitest, and `npm run verify`.
- [x] **T-1.3:** Setup Discord Embedded App SDK initialization wrapper (`/src/discord/`).
- [x] **T-1.4:** Build GitHub Actions deployment pipeline to GitHub Pages (`.github/workflows/deploy.yml`).

## Phase 2: Core Tetris Engine
- [x] **T-2.1:** Implement Board Matrix data structure (10x40 grid, pure functions).
- [x] **T-2.2:** Implement `IBagRandomizer` interface and `SevenBagRandomizer`.
- [x] **T-2.3:** Implement `IRotationSystem` interface and `SrsPlusRotationSystem` with full kick tables.
- [x] **T-2.4:** Implement DAS (Delayed Auto Shift), ARR (Auto Repeat Rate), and SDF (Soft Drop Factor) input tick handler.
- [x] **T-2.5:** Implement hold system, including clear hold / force hold setter.
- [x] **T-2.6:** Implement upcoming queue manipulation setter API.

## Phase 3: Canvas Rendering & Annotation Tool
- [x] **T-3.1:** Build modular Canvas 2D Board Renderer.
- [x] **T-3.2:** Build Canvas Queue & Hold Preview Renderers.
- [x] **T-3.3:** Implement cursor annotation drawing engine (pen, erase, clear, rect fill).
- [x] **T-3.4:** Implement automatic tetromino shape recognition and auto-coloring algorithm.
- [x] **T-3.5:** Build Annotation Toolbar UI (pen, eraser, rect fill, clear all, auto-color toggle).
- [x] **T-3.6:** Wire mouse/touch handlers on GameBoardCanvas for annotation drawing.
- [x] **T-3.7:** Integrate autoColorEngine with annotation drawing (trigger on stroke end).

## Phase 4: Settings & $0 Persistence
- [x] **T-4.1:** Build keybinding remapping engine with `localStorage` persistence.
- [x] **T-4.2:** Add JSON Import / Export functionality for keybindings and game settings.
- [x] **T-4.3:** Build UI settings modal.
- [x] **T-4.4:** Add gravity (0G-20G), 0G float, subzero toggles to GameConfig and SettingsModal.

## Phase 5: Statistics & Analytics Engine
- [x] **T-5.1:** Implement real-time stats tracker (PPS, APM, KPP, Finesse, Lines, Quads, T-Spins).
- [x] **T-5.2:** Build HUD stats renderer overlay.
- [x] **T-5.3:** Add Attack and Efficiency to stats tracker (event-driven).

## Phase 6: P2P Spectating & Presence Engine
- [x] **T-6.1:** Implement PeerJS signaling manager tied to Discord `instance_id`.
- [x] **T-6.2:** Build Host state delta broadcaster (20 Hz loop) — must respect `InstanceConfig.isPrivate` guard.
- [x] **T-6.3:** Build Spectator state interpolation & render view.
- [x] **T-6.4:** Build Presence Roster UI component displaying active Discord participants and live PPS, with private-instance badge.
- [x] **T-6.5:** Implement View Controller Switcher (toggle between Local Canvas Renderer and Remote Spectator Renderer with state preservation) — must check `target.isPrivate` before transition.
- [x] **T-6.6:** Build Private Instance toggle UI in Settings (with `localStorage` persistence) and guard the 20 Hz broadcaster.

## Phase 7: Verification & Testing
- [x] **T-7.1:** Write Vitest unit tests for SRS+ kick tables and 180 spins.
- [x] **T-7.2:** Write Vitest unit tests for 7-Bag randomizer distribution.
- [x] **T-7.3:** Write Vitest unit tests for annotation auto-coloring matrix parser.
- [x] **T-7.4:** Run `npm run verify` and fix all lint, type, and test issues.

## Phase 8: App Integration & Wiring
- [x] **T-8.1:** Wire Discord SDK initialization into App.tsx (authenticate, get userId/instanceId).
- [x] **T-8.2:** Wire Canvas renderers (BoardRenderer, QueueHoldRenderer, StatsOverlayRenderer) into App.tsx, replacing text-based display.
- [x] **T-8.3:** Wire keyboard input handler into App.tsx (bind keydown/keyup to EngineCore.handleInput).
- [x] **T-8.4:** Wire P2P components (HostBroadcaster, PeerJSManager, SpectatorBuffer) into App.tsx lifecycle.
- [x] **T-8.5:** Wire annotation toolbar and mouse handlers into App.tsx.

## Phase 9: Deployment & Discord Activity
- [x] **T-9.1:** Add `.nojekyll` file for GitHub Pages compatibility.
- [x] **T-9.2:** Document Discord Activity registration process in README.
- [x] **T-9.3:** Configure Vite `base` for Discord Activity (relative `./` paths) vs GitHub Pages (`/nimode/`).

## Phase 10: Gravity Modes & Subzero (from architecture.md lines 140-144)
- [x] **T-10.1:** Extend GameConfig with `gravity` (number, guideline G level 0-20, default 0) and `subzero` (boolean, default true).
- [x] **T-10.2:** Refactor EngineCore.applyGravity to consume config.gravity (0G = no auto-fall, 20G = instant drop).
- [x] **T-10.3:** Implement subzero mode: disable lock-on-contact, only lock on hard drop.
- [x] **T-10.4:** Add gravity/subzero controls to SettingsModal with persistence.

## Phase 11: Alternate Rotation Systems & Bag Randomizers
- [ ] **T-11.1:** Implement ARSRotationSystem (ARS - Arika Rotation System).
- [ ] **T-11.2:** Implement FourteenBagRandomizer (14-Bag).
- [ ] **T-11.3:** Implement MemorylessBagRandomizer.
- [ ] **T-11.4:** Add rotation system / bag randomizer selectors to SettingsModal.

## Phase 12: UI/UX Fixes & Quality-of-Life
- [x] **T-12.1:** Move stats overlay to the side of the board instead of floating on top (left column, done).
- [x] **T-12.2:** Reposition queue preview to the top right of the board (right column, done).
- [x] **T-12.3:** Replace CLEAR_HOLD keybind with ✕ button on Hold display (button implemented in HoldCanvas).
- [x] **T-12.4:** Implement hold swapping (repeatedly pressing hold toggles between current and held piece) — done in `holdPiece`.
- [x] **T-12.5:** Fix annotation shape detection to use actual drawn shape instead of adjacency check — stroke-scoped auto-color implemented.
- [x] **T-12.6:** Fix fuzzy/low-resolution rendering (set canvas `imageSmoothingEnabled` and use `devicePixelRatio` scaling) — done in `canvasScaling.ts`.
- [x] **T-12.7:** Fix pieces spawning partially off the board — **implemented**: added configurable `spawnOffset` to GameConfig (default 1, matching TETR.IO's "height + 1" = row 21). Updated `SrsPlusRotationSystem.getInitialState()` to compute spawn Y from config. Added spawn offset control to GravityConfigControls. Validated range 0-5 for different rulesets (NES=19, TE:C=20, TETR.IO=21, PPT=22).
- [x] **T-12.8:** Handle top-out properly — game should not freeze; allow player to reset (GAME OVER overlay with reset button).
- [x] **T-12.9:** Fix settings modal close button requiring scroll-back (sticky close button at top-right).
- [x] **T-12.10:** Add undo/redo — keyboard shortcuts `Ctrl+Z`/`Ctrl+Y` wired and functional; UI buttons not needed per decision.
- [x] **T-12.11:** Allow undo past top-outs (undo restores pre-top-out `gameOver` state via snapshot).
- [x] **T-12.12:** Move annotation toolbar toggle to the side of the board (toggle in FloatingControls top-right; panel opens left).

---

## Findings & Notes

### Completed this session (2026-07-31)
- **C1 — inverted Y axis / pieces off-screen:** gravity, soft drop, hard drop, and ghost rendering were all moving pieces toward `y=0` (upward) while the renderer maps larger `boardY` to lower on-screen rows, so pieces fell off-screen and the stack built in invisible rows 0–19. Fixed direction to `dy=+1` in `gravityEngine.ts`, `engineActions.ts`, `inputHandler.ts`, and `BoardRenderer.computeGhostY`; annotation mouse mapping in `GameBoardCanvas.tsx` now matches the renderer. Regression tests added (`gravityBehavior`, `gravityEngine`).
- **C2 — gravity config not wired:** `App.tsx` never pushed `GameConfigStore` into the engine. Added `IEngineCore.updateConfig()` and a `configStore` subscription in `App.tsx`; gravity/subzero now apply live.
- **C3 — PeerJS id collision:** all participants shared the raw `instanceId` as their PeerJS id. `usePeerSession` now uses a unique per-user id (`${instanceId}-${userId}`).
- **C4 — spectate never connected:** `ViewStateController.selectTarget` only flipped the view. It now triggers an outbound `PeerJSManager.connectToPeer()` (any role, carries identity metadata, announces the target to the roster).
- **C5 — spectator buffer wiped:** `SpectatorBuffer` reset on any `userId` change. Added `setTarget()` filtering so only the spectated user's payloads are buffered.
- **C6 — empty annotation broadcast:** `HostBroadcaster` now sends real `state.annotations`.
- **C7 — no T-spin detection:** added `tSpinDetector.ts` (3-corner rule) and threaded `LockResult` through `lockPiece`/`hardDrop` into `StatsTracker`.
- **C8 — no clear-hold action:** added `CLEAR_HOLD` input action + default binding (`U`), wired through `inputHandler`/`keyboardInput`/`EngineCore.clearHold()`.
- **C9 — dead gravity/lock config:** `lockDelay`, `maxLockResets` are now consumed via `lockDelayEngine.ts` (500ms default, reset on move/rotate, instant lock at 20G); `sdfFactor` remains reserved. `configStore` no longer dead.
- **C11 — chromatic UI:** converted UI chrome (header, roster, settings, toolbar, error text) to monochrome slate/neutral; chromatic colors remain only for tetrominoes.
- **C12 — dead code:** removed unused `StatsHud.tsx` and `idb-keyval` dependency; removed duplicate `PIECE_SPAWNS` (single canonical copy in `srsPlusKicks.ts`); removed dead `GameState.stats` (mutated copy never surfaced) — stats come from `StatsTracker`.
- **C13 — stale docs:** this section updated; gravity/subzero findings below now reflect implemented state.
- **C14 — finesse wired:** added pure `finesseTracker.ts` (per-piece move/rotation inputs vs. minimal needed to reach the final position; a single press reaches any rotation via 180) surfaced through a `PlayerStats` facade that owns `StatsTracker` + `FinesseTracker`. Engine counts move/rotate inputs on keydown and finalizes on lock/hold. Tests in `finesseTracker.test.ts` + `engineFinesse.test.ts`.
- **C15 — instance participant discovery:** `DiscordSdkWrapper.getInstanceConnectedParticipants()` maps the SDK command to `ConnectedParticipant[]`; `usePeerSession` fetches after init, seeds the controller roster (self excluded), and exposes `participants` so the `PresenceRoster` UI lists everyone in the instance (unconnected → not connected) and lets you spectate them, triggering the outbound connect. Tests added to `App.p2p.test.tsx` + `PresenceRoster.test.ts`.

### Current Implementation Status (2026-08-01)
- **All Phase 1-10 tasks complete** — core engine, rendering, P2P, settings, gravity/subzero, statistics, and Discord integration are fully implemented and tested.
- **Phase 11 (Alternate Systems)** deferred — ARS rotation, 14-Bag, Memoryless Bag not yet scoped.
- **Phase 12 (UI/UX)** — all 12 tasks complete.
- **Undo/Redo** fully functional via `Ctrl+Z`/`Ctrl+Y`; no UI buttons added per decision.
- **Hold clear** available via ✕ button on Hold display only; the dedicated `CLEAR_HOLD` keybind has been removed (button dispatch via `{ type: 'CLEAR_HOLD' }` retained).
- **Spawn position:** Fixed T-12.7 by adding configurable `spawnOffset` (default 1) to GameConfig. TETR.IO spawns at "height + 1" row (row 21 with 20 visible rows). Updated `SrsPlusRotationSystem.getInitialState()` to compute spawn Y from `VISIBLE_Y_OFFSET - 1 + spawnOffset`. Added UI control in GravityConfigControls (range 0-5, supports NES/TE:C/PPT rulesets).
- **All 520 tests pass**, `npm run verify` clean (typecheck, lint, tests).

### This session (2026-08-02)
- **Defaults changed:** gravity defaults to `0G` (float), subzero defaults **on**, spawn offset stays `1`. `DEFAULT_CONFIG.subzero = true`.
- **Gravity re-scaled to cells/sec:** `applyGravityToState` now uses `gravityRate = 1000 / gravity` ms/cell (`1G` = 1 cell/sec) instead of `1000 / (60 * gravity)` (`1G` = 60 cells/sec). Previously even small G values behaved like very high gravity (piece reached the bottom in ~0.35s at 1G). `20G` remains instant drop and instant lock-on-contact. Updated `gravityEngine`, `gravityBehavior`, `subzeroMode`, `lockDelayEngine` tests to the new rate and to the subzero-on default.
- **CLEAR_HOLD keybind removed:** dropped `CLEAR_HOLD` from `KeyBindings`, `DEFAULT_KEYBINDINGS`, `InputAction`, `keyboardInput.ts`, `settingsConstants.ts`, and `keybindingsStore` (which now strips stale persisted keys). The ✕ button on the Hold display keeps working via the `{ type: 'CLEAR_HOLD' }` engine event / `InputState.clearHold` pipeline. Updated `keyboardInput.test.ts` and `settingsIO.import.test.ts` fixtures.
- **Subzero-on ripple:** tests exercising lock-on-ground under the default config now opt out explicitly with `subzero: false` (e.g. `softDropBehavior`, `gravityBehavior`, `lockDelayEngine`).

### Remaining known gaps
- **`setQueue`** has no UI (engine-level API only); no queue/hold editor for the upcoming queue.
- **Alternate systems** (T-11.1–T-11.4: ARS, 14-Bag, Memoryless) not implemented — deferred (per decision).
- Peerjs discovery relies on `getInstanceConnectedParticipants` at session start; roster refreshes only on connect/disconnect events.

### Next steps (prioritized)
1. Implement alternate rotation systems & bag randomizers (T-11.x) when scoped.
2. Add a queue-editor UI for `setQueue`/`clearHold`.
3. Consider periodic roster refresh if instance membership changes mid-session.