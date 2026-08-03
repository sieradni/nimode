# nimode

A high-performance singleplayer Tetris practice tool designed to run as a Discord Activity. Inspired by Fourtris, it enables players to freely annotate the board, set upcoming queues, auto-color tetrominos, clear hold pieces, and customize controls—all at $0 infrastructure cost.

## Features

- **Standard Tetris Gameplay**: Fluid movement (DAS, ARR, SDF), TETR.IO SRS+ wall kicks, 7-Bag randomizer
- **Practice Tools**: Hold clear/lock, queue manipulation, adjustable gravity (0G–20G), 0G float mode, subzero mode
- **Cursor Annotation**: Draw on the board, auto-color recognized tetromino shapes, clear tools
- **Full Keybinding Customization**: Rebinding with localStorage persistence, JSON import/export
- **Spectating**: Supabase Realtime relay (each peer broadcasts its own state; viewers connect to the spectated instance via the relay), presence roster, private instance toggle
- **Statistics**: Real-time PPS, APM, KPP, Finesse, lines, quads, T-spins
- **$0 Infrastructure**: Static hosting on GitHub Pages, localStorage persistence, Supabase Realtime relay

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

### 2.1 Provide the Discord Client ID to CI / deployment

`VITE_DISCORD_CLIENT_ID` must be present at **build time** (Vite inlines `import.meta.env` into the bundle). `.env.local` covers local dev only — it is gitignored and never reaches CI. For GitHub Actions, create a repository secret named `VITE_DISCORD_CLIENT_ID` (Settings → Secrets and variables → Actions → New repository secret) with your Discord Application **Client ID**, and the `deploy.yml` Build step will inject it automatically.

### 2.1 Supabase Realtime Relay

nimode uses a Supabase Realtime relay (instead of P2P WebRTC) for cross-client spectating. This is required because Discord Activity iframes (web/iOS/Android) do not support WebRTC, and the relay also keeps the "you are here" roster consistent across all clients.

1. Create a **Supabase project** (free tier is sufficient) at https://supabase.com/dashboard.
2. Link it locally:
   ```bash
   npx supabase login
   npx supabase link --project-ref <YOUR_PROJECT_REF>
   ```
3. Deploy the Edge Function that authorizes relay sessions and mints a short-lived member JWT:
   ```bash
   npx supabase functions deploy authorize-activity
   ```
4. Add the required secrets to the function (**Project Settings → Functions → authorize-activity → Secrets → Add new**):
   - `SERVICE_ROLE_KEY` — your project's **service_role** key (Project Settings → API).
   - `DISCORD_CLIENT_ID` — your Discord application's client id.
   - `DISCORD_CLIENT_SECRET` — your Discord application's client secret.
   > Do not name any secret `SUPABASE_*` — the dashboard rejects that prefix in secret key names.
5. Create `.env.local` from `.env.example` and fill in your project's values:
   ```env
   VITE_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon public key>
   VITE_RELAY_FUNCTION_URL=https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/authorize-activity
   VITE_DISCORD_CLIENT_ID=<discord application client id>
   ```

**How the relay works:** each client exchanges its Discord `access_token` (obtained via the Embedded App SDK) through the `authorize-activity` function. The function verifies the token against `https://discord.com/api/users/@me`, then mints a Supabase signed JWT encoding the user + instance. The client uses that JWT to authenticate a Supabase Realtime channel for its instance. Each peer broadcasts its own engine state on that channel; viewers spectate by listening to another peer's broadcast. Private instances never broadcast state. No host election — every user only ever sees their own instance, and leaving/stopping spectate returns them to their local board.

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

### 5. Deploy to GitHub Pages

1. Push to `main` branch
2. GitHub Actions will:
   - Run `npm run verify` (typecheck, lint, tests)
   - Build with `VITE_BASE_PATH=/nimode/`
   - Deploy `dist/` to GitHub Pages
3. Enable **GitHub Pages** in repository settings (Source: GitHub Actions)
4. Update the Activity **Launch URL** to your GitHub Pages URL

### 6. Verify Deployment

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
├── p2p/              # Supabase Realtime relay, HostBroadcaster, SpectatorBuffer, ViewStateController
└── __tests__/        # Integration tests

supabase/
├── functions/
│   └── authorize-activity/   # Edge Function: verifies Discord token, mints Supabase relay JWT
└── config.toml               # Supabase project config
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
- **Privacy-First Relay**: Private instances never broadcast state; guarded at the broadcaster level
- **Strict TypeScript**: Zero `any`, strict null checks, exhaustive switch matching

## License

Apache 2.0
