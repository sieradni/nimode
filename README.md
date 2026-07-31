# nimode

A high-performance singleplayer Tetris practice tool designed to run as a Discord Activity. Inspired by Fourtris, it enables players to freely annotate the board, set upcoming queues, auto-color tetrominos, clear hold pieces, and customize controls—all at $0 infrastructure cost.

## Features

- **Standard Tetris Gameplay**: Fluid movement (DAS, ARR, SDF), TETR.IO SRS+ wall kicks, 7-Bag randomizer
- **Practice Tools**: Hold clear/lock, queue manipulation, adjustable gravity (0G–20G), 0G float mode, subzero mode
- **Cursor Annotation**: Draw on the board, auto-color recognized tetromino shapes, clear tools
- **Full Keybinding Customization**: Rebinding with localStorage persistence, JSON import/export
- **Spectating**: P2P WebRTC spectating via PeerJS, presence roster, private instance toggle
- **Statistics**: Real-time PPS, APM, KPP, Finesse, lines, quads, T-spins
- **$0 Infrastructure**: Static hosting on GitHub Pages, localStorage persistence, WebRTC P2P

## Discord Activity Setup

### 1. Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → name it (e.g., "nimode")
3. Navigate to **OAuth2 → General** and copy the **Client ID**
4. Navigate to **Activities** (under "Build" in the sidebar)
5. Click **Create Activity** and fill in:
   - **Activity Name**: nimode
   - **Launch URL**: `https://<your-github-username>.github.io/nimode/` (after deployment)
   - **Orientation**: Landscape
   - **Platform**: Web
   - **Permissions**: `activity.read`, `activity.write`, `voice.read`, `voice.write`
6. Save changes

### 2. Configure Environment Variables

Create a `.env.local` file in the project root (or set in your CI/CD):

```env
VITE_DISCORD_CLIENT_ID=your_discord_client_id_here
VITE_BASE_PATH=./
```

**Note**: For Discord Activity, use `VITE_BASE_PATH=./` (relative paths). For GitHub Pages deployment, the CI sets `VITE_BASE_PATH=/nimode/`.

### 3. Local Development

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`. To test in Discord:
1. Enable **Developer Mode** in Discord (Settings → Advanced)
2. Right-click your app in the Developer Portal → **Copy Application ID**
3. In Discord, press `Ctrl+Shift+I` to open DevTools
4. Run in console: `location.href = "https://discord.com/activities/<YOUR_APP_ID>"`

Or use the [Discord Activity Test Tool](https://discord.com/developers/docs/activities/building-an-activity#testing-your-activity).

### 4. Deploy to GitHub Pages

1. Push to `main` branch
2. GitHub Actions will:
   - Run `npm run verify` (typecheck, lint, tests)
   - Build with `VITE_BASE_PATH=/nimode/`
   - Deploy `dist/` to GitHub Pages
3. Enable **GitHub Pages** in repository settings (Source: GitHub Actions)
4. Update the Activity **Launch URL** to your GitHub Pages URL

### 5. Verify Deployment

1. Open your GitHub Pages URL in browser — app should load
2. In Discord, open the Activity from the rocket ship icon in voice channels
3. Test multi-user: invite a friend to the voice channel and launch the Activity together

## Project Structure

```
src/
├── engine/           # Core Tetris engine (pure TypeScript)
│   ├── systems/      # Rotation systems, bag randomizers
│   ├── interfaces/   # Strategy interfaces (IRotationSystem, IBagRandomizer)
│   └── __tests__/    # Engine unit tests
├── render/           # Canvas 2D renderers (board, queue, hold, stats, spectator)
├── components/       # React components (GameCanvas, SettingsModal, PresenceRoster)
├── discord/          # Discord Embedded App SDK wrapper
├── p2p/              # PeerJS WebRTC spectating (host, spectator, presence)
└── __tests__/        # Integration tests
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build (uses `VITE_BASE_PATH`) |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler check |
| `npm run verify` | Run typecheck + lint + test |
| `npm run deploy` | Deploy to GitHub Pages (manual) |

## Architecture Highlights

- **Modular Strategy Pattern**: Swappable rotation systems (SRS+, ARS) and bag randomizers (7-Bag, 14-Bag)
- **Engine/Render Separation**: Game logic runs at 60Hz tick, Canvas rendering is decoupled
- **State Machine View Controller**: `LOCAL_ACTIVE` ↔ `SPECTATING_TARGET` with instant switching
- **Privacy-First P2P**: Private instances never broadcast state; guarded at broadcaster level
- **Strict TypeScript**: Zero `any`, strict null checks, exhaustive switch matching

## License

MIT