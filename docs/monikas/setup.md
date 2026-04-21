# Monikas — Local Setup

## Prerequisites

- macOS with Xcode 16+ (iOS 17 target)
- Node.js + npm (same as the rest of thePsychology.ai repo)
- [xcodegen](https://github.com/yonaskolb/XcodeGen): `brew install xcodegen`
- libpq psql binary at `/usr/local/opt/libpq/bin/psql` (optional — only if re-applying migrations)

## One-time DB setup

Migrations already live at `supabase/migrations/20260419_monikas_*.sql`. To re-apply against a fresh Supabase project:

```bash
source .env.local
for f in supabase/migrations/20260419_monikas_*.sql; do
  /usr/local/opt/libpq/bin/psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

This creates all 15 `monikas_*` tables plus RPCs, RLS policies, realtime publications, and seed data (80 fallback cards, 12 preset avatars, 20 acting modifiers, 15 recap lines, 20 suggestion prompts).

## Running the web app

From repo root:

```bash
npm run dev
```

Then:

- `http://localhost:3000/lab/monikas` — about page (shown in the lab ring animation)
- `http://localhost:3000/join/<ROOM_CODE>` — player join page (mobile-first)

## Running the iOS host app

```bash
cd ios/MonikasHost
xcodegen generate
open MonikasHost.xcodeproj
```

Select a simulator (iPhone 15 or later, iOS 17+) and run.

### Testing on a physical iPhone

The app talks to `http://localhost:3000/api/monikas`. A real device can't reach your Mac's `localhost`. Either:

1. Edit `Constants.swift` and replace `localhost` with your Mac's LAN IP (e.g. `http://192.168.1.12:3000`).
2. Or deploy to Vercel and flip to the prod URL (`#else` branch).

### AirPlay test

On a real iPhone, screen-mirror to a TV via AirPlay. Nothing happens automatically on the simulator (external displays aren't simulated). When connected, the green dot and "TV connected" copy appears in the lobby header, and the TV shows a big "MONICAS" splash (milestone 3 replaces it with the real game scene).

## Verifying the round-trip

1. Create a room from the iOS app (tap Create room, enter a name, tap Create).
2. Note the 4-letter code.
3. On a phone browser (or laptop), visit `http://localhost:3000/join/<CODE>`.
4. Enter a name and tap Join.
5. The lobby on the iPhone should show the new player within ~1.5 seconds (polling interval).

## Environment variables

All live in `.env.local` already:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (for applying migrations via psql)

No Monikas-specific env vars for M1.
