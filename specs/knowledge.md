# Knowledge Base & Domain Rules: nimode

## TETR.IO SRS+ Rotation Logic
1. **Board Grid Coordinates:** 10 columns wide (0 to 9), 40 rows high (0 to 39; visible rows 0 to 19, hidden rows 20 to 39).
2. **Rotation States:** 0 (spawn), 1 (90° CW), 2 (180°), 3 (270° CCW).
3. **SRS+ Wall Kick Tables:**
   - Standard SRS applies for basic J, L, S, Z, T pieces.
   - SRS+ modified I-piece kicks avoid unnatural floor climbs.
   - 180-degree rotations use dedicated 180 kick tables.
4. **T-Spin Detection:**
   - Piece must be a T-tetromino placed via rotation.
   - At least 3 of the 4 diagonal corners around the T center must be occupied by filled blocks or board boundaries.
   - Mini T-Spin vs Full T-Spin depends on point-side corner orientation.

---

## Annotation Auto-Color Rules
When the user draws blocks in Annotation mode:
1. Flood-fill search identifies connected 4-block components (orthogonally adjacent).
2. Connected components are matched against the 7 canonical tetromino shapes (I, J, L, O, S, T, Z).
3. Matched shapes are automatically recolored to match standard piece colors:
   - **Cyan:** I Tetromino
   - **Blue:** J Tetromino
   - **Orange:** L Tetromino
   - **Yellow:** O Tetromino
   - **Green:** S Tetromino
   - **Purple:** T Tetromino
   - **Red:** Z Tetromino

---

## Instance Privacy Design Rules
1. **Privacy ≠ Auth:** The `isPrivate` flag is a local preference, not an authentication mechanism. It does not prevent network-level snooping; it simply stops the host broadcaster from sending state.
2. **Presence Without State:** Even when private, the participant still appears in the Discord Activity Presence Roster so the session knows who is online. Only the select-for-spectate action is blocked.
3. **Persistence:** `isPrivate` is persisted in `localStorage` and restored on session join. It is not synced to other peers.
4. **Default:** New instances default to `isPrivate: false` (Public) to match the existing behavior of full visibility.

## Gravity & Lock Domain Rules
1. **G Unit:** Gravity is measured in guideline G levels, where `1G` = one cell of downward movement per frame at 60 fps (60 cells/sec).
2. **Range:** Gravity is adjustable from `0G` (no gravitational fall) up to `20G` (instant drop — piece spawns directly on its landing surface).
3. **0G Float Mode:** At `0G`, the active piece never falls on its own; soft drop is the only downward movement.
4. **Subzero Mode:** When subzero is enabled, landing on the stack never triggers a lock. A grounded piece locks **only** on hard drop. Subzero is independent of the gravity level.
5. **Defaults:** Default gravity is `1G`; subzero defaults to off (normal lock-on-contact behavior).

---

## UI Style Guidelines
1. **Minimal:** Only elements required for gameplay appear; no decorative chrome, icons, or flourishes.
2. **Purely Functional:** Every visible element must serve a purpose — state display, control, or feedback.
3. **Monochrome:** UI chrome uses a single neutral scale (white / greys / black). Chromatic color is reserved exclusively for tetromino/piece representation.
4. **Consistency:** Interactive and hover states are conveyed through brightness or weight changes on the neutral scale — never through hue shifts.

---

## Discord Embedded App SDK Gotchas
1. **Frame Proxying:** Discord proxies all external requests through `.discordsays.com`. All asset paths in Vite must be relative (`base: "./"`).
2. **WebRTC STUN:** Public Google STUN (`stun.l.google.com:19302`) passes through Discord's WebSocket proxies without requiring TURN credentials for >95% of client environments.
3. **Storage Scope:** `localStorage` is scoped to the activity iframe origin. Export/Import functionality ensures user settings are never trapped or lost.