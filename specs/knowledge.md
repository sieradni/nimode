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

## Discord Embedded App SDK Gotchas
1. **Frame Proxying:** Discord proxies all external requests through `.discordsays.com`. All asset paths in Vite must be relative (`base: "./"`).
2. **WebRTC STUN:** Public Google STUN (`stun.l.google.com:19302`) passes through Discord's WebSocket proxies without requiring TURN credentials for >95% of client environments.
3. **Storage Scope:** `localStorage` is scoped to the activity iframe origin. Export/Import functionality ensures user settings are never trapped or lost.