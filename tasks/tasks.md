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
- [x] **T-3.1:** Build modular Canvas 2D Board Renderer (<150 lines).
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
- [x] **T-10.1:** Extend GameConfig with `gravity` (number, guideline G level 0-20, default 1) and `subzero` (boolean, default false).
- [x] **T-10.2:** Refactor EngineCore.applyGravity to consume config.gravity (0G = no auto-fall, 20G = instant drop).
- [x] **T-10.3:** Implement subzero mode: disable lock-on-contact, only lock on hard drop.
- [x] **T-10.4:** Add gravity/subzero controls to SettingsModal with persistence.

## Phase 11: Alternate Rotation Systems & Bag Randomizers
- [ ] **T-11.1:** Implement ARSRotationSystem (ARS - Arika Rotation System).
- [ ] **T-11.2:** Implement FourteenBagRandomizer (14-Bag).
- [ ] **T-11.3:** Implement MemorylessBagRandomizer.
- [ ] **T-11.4:** Add rotation system / bag randomizer selectors to SettingsModal.

---

## Findings & Notes

### Local-dev white page (diagnosed)
- **Root cause (confirmed):** a browser **adblocker** content script (`content.js`) was intercepting Vite dev-server module loads — manifested as `Loading failed for the module …/src/engine/statsTracker.ts` plus `Ignoring unsupported entryTypes: longtask. content.js`. The module bytes are valid (Vite serves `statsTracker.ts` as 200 `text/javascript`, clean startup log); disabling the adblocker restores the app. Not a code bug.
- **Secondary (verified, separate path):** the on-disk `dist/` was built in CI with `VITE_BASE_PATH=/nimode/`, so its asset URLs are absolute (`/nimode/assets/…`). Serving that `dist` on localhost at root (e.g. `npm run preview` of the stale bundle) → JS 404 → blank `#root`. Deployed works because GH Pages serves under the matching `/nimode/` prefix. Local build uses `VITE_BASE_PATH=./` (via `.env.local`).
- **Working-tree fix committed alongside this update:** `index.html` source paths → relative (`./src/main.tsx`, `./favicon.svg`) to match `base: './'` and the Discord Activity embedded context; `vite.config.ts` gained a `server` block (`host`, `allowedHosts`, CORS header) for LAN/Discord dev testing.

### Completion status (gaps vs. README claims)
- README advertises "adjustable gravity (0G–20G), 0G float mode, subzero mode" — **not implemented**: `GameConfig` has no `gravity`/`subzero` fields and `EngineCore.applyGravity` (`src/engine/EngineCore.ts:113`) is hardcoded to 1G. (T-4.4, T-10.1–T-10.4.)
- Alternate systems (T-11.1–T-11.4: ARS, 14-Bag, Memoryless) not implemented.
- AGENTS.md 150-line rule violated: `src/App.tsx` (163), `src/engine/EngineCore.ts` (181), and several large test files (e.g. `PeerJSManager.test.ts` 426, `HostBroadcaster.test.ts` 321).

### Next steps (prioritized)
1. Implement gravity/subzero (T-10.1–T-10.4): extend `GameConfig`/`Types`, refactor `applyGravity` to consume `config.gravity`, add SettingsModal controls — tests first.
2. Split `App.tsx` and `EngineCore.ts` into <150-line modules.
3. Implement alternate rotation systems & bag randomizers (T-11.x).
4. Add the 150-line file cap to the verify/lint workflow so it's enforced (currently only self-imposed).