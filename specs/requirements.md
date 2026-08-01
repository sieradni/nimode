# Product Requirements & User Stories: nimode

## Executive Summary
`nimode` is a high-performance singleplayer Tetris practice tool designed to run as a Discord Activity. Inspired by Fourtris, it enables players to freely annotate the board, set upcoming queues, auto-color tetrominos, clear hold pieces, and customize controls—all at $0 infrastructure cost. Players maintain their own independent local singleplayer session while being able to spectate any friend in the Discord Activity session at will.

---

## 1. User Stories

### Core Singleplayer & Tetris Gameplay
- **US-1.1:** As a player, I want to play standard Tetris with fluid movement (DAS, ARR, SDF) so I can train my muscle memory.
- **US-1.2:** As a player, I want TETR.IO SRS+ wall kicks by default so that pieces spin and kick identically to modern high-level Tetris clients.
- **US-1.3:** As a player, I want a 7-Bag randomizer by default to ensure fair piece distribution.
- **US-1.4:** As a player, I want the ability to clear or swap the hold piece during practice sessions.
- **US-1.5:** As a player, I want to set or override the upcoming queue pieces so I can practice specific stacking scenarios or openers.
- **US-1.6:** As a player, I want to adjust gravity using guideline G levels (0G to 20G) so I can train speed and timing.
- **US-1.7:** As a player, I want a 0G float mode where pieces never fall under gravity — only soft drop moves them — so I can stack without time pressure.
- **US-1.8:** As a player, I want a subzero mode where pieces never lock on contact and only lock when I hard drop, so I can freely reposition pieces.
- **US-1.9:** As a player, I want the spawn position of pieces and top out rules to be exactly the same as TETR.IO so that I can practice scenarios where the pieces and placed blocks extend past the top of the board.
- **US-1.10:** As a player, I want all the rotation system to be properly implemented such that I can practive every spin possible with the correct inputs and outcome.
- **US-1.11:** As a player, I want the attack display to accurately reflect standard attack values, so that I can have an accurate idea of how much attack I am sending.
- **US-1.12:** As a player, I want to be able to undo every action including but not limited to placing pieces, adjusting queue, annotating, or managing hold, where pressing undo and redo always work as I expect.

### Cursor Annotation & Tooling
- **US-2.1:** As a player, I want to use my mouse cursor to draw blocks directly onto the board matrix like a whiteboard tool.
- **US-2.2:** As a player, I want filled matrix blocks to auto-color into valid tetromino colors when they form recognized 4-block shapes.
- **US-2.3:** As a player, I want tools to clear line fills, erase custom blocks, or reset the board instant-practice style.

### Control Customization & $0 Persistence
- **US-3.1:** As a player, I want to rebind all game controls (Move Left/Right, Soft Drop, Hard Drop, Rotate CW/CCW/180, Hold, Reset) and have them persist across sessions without logging into a paid service.

### Spectating & Multi-Instance Flow
- **US-4.1:** As a Discord user in the Activity session, I want my own independent local singleplayer game running at 60 FPS.
- **US-4.2:** As a spectator, I want to view a roster of active participants in the Discord Activity, select any user to spectate their game live at low latency (<50ms), and see their board, active piece, queue, hold, annotations, and live statistics.
- **US-4.3:** As a player, I want to click "Return to My Board" at any time to instantly return to my own local singleplayer game with zero state loss.

### Instance Privacy & Access Control
- **US-4.4:** As a player, I want to toggle my instance between Public and Private so that I can choose whether other participants in the Discord Activity can spectate my game.
- **US-4.5:** As a spectator, I want to see which participants have made their instance Private so that I know who is unavailable for spectating.
- **US-4.6:** As a player with a Private instance, I want a visual indicator in the Presence Roster showing my instance is Private, and my game state must never be broadcast over WebRTC.

### UI & Presentation
- **US-6.1:** As a player, I want a minimal, purely functional interface so that no decorative element competes with the game board for attention.
- **US-6.2:** As a player, I want a monochrome interface so that chromatic color is reserved exclusively for tetromino representation and never used for UI chrome.
- **US-6.3:** As a player, I want the UI to be clean, attractive, and consistent instead of having elements randomly placed on the screen.

### UI/UX Fixes & Quality-of-Life
- **US-7.1:** As a player, I want the stats overlay displayed on the side of the board rather than floating on top of it, so the board is never obscured.
- **US-7.2:** As a player, I want the upcoming queue displayed on the top right of the board so it is clearly visible without cluttering the side panel.
- **US-7.3:** As a player, I want the `x` button for the hold display to clear the hold piece instead of a dedicated clear-hold keybind, so that I don't have to manage a new keybind.
- **US-7.4:** As a player, I want to repeatedly press hold to swap between the current piece and the hold piece, so I can freely experiment with piece selection.
- **US-7.5:** As a player, I want annotation shape detection to use the actual drawn shape rather than checking for adjacency to existing tetromino shapes, so annotations that are adjacent to placed pieces are correctly recognized.
- **US-7.6:** As a player, I want rendered shapes, text, and lines to appear crisp and high-resolution, so the interface looks clean at any display scale.
- **US-7.7:** As a player, I want pieces to spawn fully visible, even when partially off the board, so I can always see my active piece.
- **US-7.8:** As a player, I want the game to handle top-outs properly by allowing a reset instead of freezing, so I can recover from a game over state.
- **US-7.9:** As a player, I want the settings modal close button to be always accessible without requiring scroll-back, so I can close settings quickly.
- **US-7.10:** As a player, I want undo and redo buttons that save all history and actions, so I can revert or reapply mistakes.
- **US-7.11:** As a player, I want to undo past top-outs, so I can recover from a game over and continue playing.
- **US-7.12:** As a player, I want the annotation toolbar toggle to be shown on the side of the board rather than covering it, so the board remains visible when tools are open.
- **US-7.13:** As a developer, I want all UI/UX fixes and quality-of-life improvements documented in the requirements specification.

### Rotation, Controls & Annotation Corrections
- **US-8.1:** As a player, I want the rotate-clockwise key to rotate pieces clockwise on screen and rotate-counter-clockwise to rotate them counter-clockwise, using the standard layout (`Z` = CCW, `X` = CW, `C` = Hold) so rotation matches muscle memory from other clients.
- **US-8.2:** As a player, I want undo and redo bound to combination keys — `Ctrl+Z` and `Ctrl+Y` by default — and I want to be able to bind any action to a modifier combination, so control bindings are not restricted to single keys.
- **US-8.3:** As a player, I want a bound key to suppress the browser's own shortcut for that combination, so `Ctrl+Z` undoes in-game rather than in the browser.
- **US-8.4:** As a player, I want the right mouse button to erase annotations regardless of the selected tool, so erasing never requires switching tools.
- **US-8.5:** As a player, I want auto-color to evaluate only the shape I just drew, so a piece drawn adjacent to an existing piece is still recognised instead of merging with its neighbour.
- **US-8.6:** As a player, I want drawn cells to default to white and take their colour from a colour picker rather than a preset tetromino selector, so annotation colour is a free choice and not tied to piece identity.
- **US-8.7:** As a player, I expect to be able to set my handling so that I can practice infinite DAS finesse by setting ARR to 0. I should be able to hold right and tap left to move a piece one left of the right wall where the right input movement should be canceled.
- **US-8.8:** As a player, I expect to be able to set my handling so that I can practice infinite soft drop speed that is not limited by the tick rate.
- **US-8.9:** As a player, I expect soft drop to work exactly like games such as TETR.IO, where the soft drop is a consistent speed regardless of how long I'm pressing it.


### Layout & Presentation Corrections
- **US-9.1:** As a player, I want the upcoming queue positioned directly adjacent to the top right of the board, so it reads naturally alongside the playfield. The queue must always be in a fixed position and size relative to the board and should not be next to the edge of the screen, and never off screen.
- **US-9.2:** As a player, I want the statistics panel on the left of the board, so stats and queue are balanced on opposite sides.
- **US-9.3:** As a player, I want no top navigation bar; any controls or status must float in their own corner of the view so the design stays minimal and nothing consumes vertical space.
- **US-9.4:** As a player, I want the board and all rendered text and lines to appear crisp on high-DPI displays, so nothing looks blurry.
- **US-9.5:** As a player, I want the ghost/landing indicator drawn as a thick white outline rather than a tinted copy of the piece colour, so it reads clearly as a shadow.
- **US-9.6:** As a player, I want the playfield to resize to fit the actual viewport, so the board always fills the available space without clipping or scrolling.
- **US-9.7:** As a player, I want the hold display to be adject to the top left corner of the board. It should be in a fixed position and scale relative to the board, so that I can see it clearly and the position is consistent regardless of screen size.
- **US-5.1:** As a developer, I want the rotation system to be modular so that ARS, Standard SRS, or Custom Rotation Systems can be selected in future updates.
- **US-5.2:** As a developer, I want the bag system to be modular so that 14-Bag, Memoryless, or Custom Bag generators can be swapped cleanly.
- **US-5.3:** As a developer, I want an event-driven stats system to calculate PPS, APM, KPP, Finesse, Quad/T-Spin counts, Attack, and Efficiency.

---

## 2. Non-Functional Requirements
1. **$0 Operating Cost:** Zero server hosting costs. Static files served via GitHub Pages; persistence via `localStorage`; P2P networking via WebRTC/PeerJS.
2. **Performance:** Solid 60 FPS rendering on Canvas 2D with engine tick isolated from React re-render cycles.
3. **Type Safety:** 100% strict TypeScript compliance with zero explicit or implicit `any` types.
4. **UI Aesthetic:** The interface must be minimal, purely functional, and monochrome — no decorative elements, and chromatic color is reserved exclusively for tetromino representation. There is no persistent navigation chrome; controls and status float over the corners of the view.
5. **Rendering Fidelity:** All canvases must size their backing store by `devicePixelRatio` and draw single-pixel strokes on half-pixel centres, so output is crisp at any display scale.
6. **Responsive Viewport:** The playfield must scale to the available viewport rather than a fixed pixel size, and the app must never scroll.