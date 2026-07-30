# Product Requirements & User Stories: nimode

## Executive Summary
`nimode` is a high-performance singleplayer Tetris practice tool designed to run as a Discord Activity. Inspired by Fourtris, it enables players to freely annotate the board, set upcoming queues, auto-color tetrominos, clear hold pieces, and customize controls—all at $0 infrastructure cost. Players maintain their own independent local singleplayer session while being able to spectate any friend in the Discord Activity session at will.

---

## 1. User Stories

### Core Singleplayer & Tetris Gameplay
- **US-1.1:** As a player, I want to play standard Tetris with fluid movement (DAS, ARR, SDF) so I can train my muscle memory.
- **US-1.2:** As a player, I want TETR.IO SRS+ wall kicks by default so that pieces spin and kick identically to modern high-level Tetris clients.
- **US-1.3:** As a player, I want a 7-Bag randomizer by default to ensure fair piece distribution.
- **US-1.4:** As a player, I want the ability to clear or clear/lock the hold piece during practice sessions.
- **US-1.5:** As a player, I want to set or override the upcoming queue pieces so I can practice specific stacking scenarios or openers.

### Cursor Annotation & Tooling
- **US-2.1:** As a player, I want to use my mouse cursor to draw blocks directly onto the board matrix like a whiteboard tool.
- **US-2.2:** As a player, I want filled matrix blocks to auto-color into valid tetromino colors when they form recognized 4-block shapes.
- **US-2.3:** As a player, I want tools to clear line fills, erase custom blocks, or reset the board instant-practice style.

### Control Customization & $0 Persistence
- **US-3.1:** As a player, I want to rebind all game controls (Move Left/Right, Soft Drop, Hard Drop, Rotate CW/CCW/180, Hold, Reset) and have them persist across sessions without logging into a paid service.
- **US-3.2:** As a player, I want to export and import my control mappings and settings as a `.json` file.

### Spectating & Multi-Instance Flow
- **US-4.1:** As a Discord user in the Activity session, I want my own independent local singleplayer game running at 60 FPS.
- **US-4.2:** As a spectator, I want to view a roster of active participants in the Discord Activity, select any user to spectate their game live at low latency (<50ms), and see their board, active piece, queue, hold, annotations, and live statistics.
- **US-4.3:** As a player, I want to click "Return to My Board" at any time to instantly return to my own local singleplayer game with zero state loss.

### Extensibility & Future Readiness
- **US-5.1:** As a developer, I want the rotation system to be modular so that ARS, Standard SRS, or Custom Rotation Systems can be selected in future updates.
- **US-5.2:** As a developer, I want the bag system to be modular so that 14-Bag, Memoryless, or Custom Bag generators can be swapped cleanly.
- **US-5.3:** As a developer, I want an event-driven stats system to calculate PPS, APM, KPP, Finesse, Quad/T-Spin counts, Attack, and Efficiency.

---

## 2. Non-Functional Requirements
1. **$0 Operating Cost:** Zero server hosting costs. Static files served via GitHub Pages; persistence via `localStorage`; P2P networking via WebRTC/PeerJS.
2. **Performance:** Solid 60 FPS rendering on Canvas 2D with engine tick isolated from React re-render cycles.
3. **Modularity Constraint:** No source code file shall exceed 150 lines of code.
4. **Type Safety:** 100% strict TypeScript compliance with zero explicit or implicit `any` types.