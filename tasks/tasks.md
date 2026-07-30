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
- [ ] **T-2.6:** Implement upcoming queue manipulation setter API.

## Phase 3: Canvas Rendering & Annotation Tool
- [ ] **T-3.1:** Build modular Canvas 2D Board Renderer (<150 lines).
- [ ] **T-3.2:** Build Canvas Queue & Hold Preview Renderers.
- [ ] **T-3.3:** Implement cursor annotation drawing engine (pen, erase, clear, rect fill).
- [ ] **T-3.4:** Implement automatic tetromino shape recognition and auto-coloring algorithm.

## Phase 4: Settings & $0 Persistence
- [ ] **T-4.1:** Build keybinding remapping engine with `localStorage` persistence.
- [ ] **T-4.2:** Add JSON Import / Export functionality for keybindings and game settings.
- [ ] **T-4.3:** Build UI settings modal.

## Phase 5: Statistics & Analytics Engine
- [ ] **T-5.1:** Implement real-time stats tracker (PPS, APM, KPP, Finesse, Lines, Quads, T-Spins).
- [ ] **T-5.2:** Build HUD stats renderer overlay.

## Phase 6: P2P Spectating & Presence Engine
- [ ] **T-6.1:** Implement PeerJS signaling manager tied to Discord `instance_id`.
- [ ] **T-6.2:** Build Host state delta broadcaster (20 Hz loop).
- [ ] **T-6.3:** Build Spectator state interpolation & render view.
- [ ] **T-6.4:** Build Presence Roster UI component displaying active Discord participants and live PPS.
- [ ] **T-6.5:** Implement View Controller Switcher (toggle between Local Canvas Renderer and Remote Spectator Renderer with state preservation).

## Phase 7: Verification & Testing
- [ ] **T-7.1:** Write Vitest unit tests for SRS+ kick tables and 180 spins.
- [ ] **T-7.2:** Write Vitest unit tests for 7-Bag randomizer distribution.
- [ ] **T-7.3:** Write Vitest unit tests for annotation auto-coloring matrix parser.
- [ ] **T-7.4:** Run `npm run verify` and fix all lint, type, and test issues.