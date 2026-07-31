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

## Phase 4: Settings & $0 Persistence
- [x] **T-4.1:** Build keybinding remapping engine with `localStorage` persistence.
- [x] **T-4.2:** Add JSON Import / Export functionality for keybindings and game settings.
- [x] **T-4.3:** Build UI settings modal.

## Phase 5: Statistics & Analytics Engine
- [x] **T-5.1:** Implement real-time stats tracker (PPS, APM, KPP, Finesse, Lines, Quads, T-Spins).
- [x] **T-5.2:** Build HUD stats renderer overlay.

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

## Phase 9: Deployment & Discord Activity
- [x] **T-9.1:** Add `.nojekyll` file for GitHub Pages compatibility.
- [ ] **T-9.2:** Document Discord Activity registration process in README.
- [ ] **T-9.3:** Configure Vite `base` for Discord Activity (relative `./` paths) vs GitHub Pages (`/nimode/`).