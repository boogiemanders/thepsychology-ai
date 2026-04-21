# Monikas — Schema Overview

All tables are prefixed `monikas_` and live in the shared Supabase project. All writes go through API routes with the service role key; clients never mutate tables directly.

## Core state

| Table | Purpose |
|---|---|
| `monikas_rooms` | One row per active game. Status, round, timer, current actor. |
| `monikas_players` | One row per participant per room. Identity is an opaque `player_token`, not a user account. |
| `monikas_cards` | User-submitted + fallback cards for a specific room. Lifecycle: `unplayed / guessed / skipped / removed`. |
| `monikas_turns` | One row per actor-turn. Used for recap, analytics, funny layer tie-ins. |

## Persistence and recovery

| Table | Purpose |
|---|---|
| `monikas_room_snapshots` | Append-only JSONB snapshots. Latest snapshot is the resume point. |
| `monikas_round_recaps` | Per-round summary JSON (hardest card, fastest guess, saved quotes, etc). |

## Funny layer

| Table | Purpose |
|---|---|
| `monikas_quotes` | Manually entered quotes tied to a turn or room. No audio, no transcription. |
| `monikas_card_votes` | Legend / broke-the-room votes (unique per player + card + vote type). |
| `monikas_clue_requests` | Optional AI clue attempts per card. Logged for debugging. |

## Catalog / seeded content

| Table | Purpose |
|---|---|
| `monikas_preset_avatars` | 12 starter avatars players can pick or draw on top of. |
| `monikas_acting_modifiers` | 20 character/impression/mood prompts (divorced magician, church auntie, etc). |
| `monikas_recap_lines` | 15 short roast lines keyed by `trigger_type` (many_skips, zero_guesses, fast_success, total_panic, obvious_misplay, miracle_comeback). |
| `monikas_card_suggestion_prompts` | 20 truth-based inspiration prompts shown during card submission. |
| `monikas_fallback_decks` / `monikas_fallback_deck_cards` | 80 pre-seeded cards used to fill low-submission rooms. |

## Identity and auth

No Supabase Auth. No user accounts. When a player creates or joins a room, a 48-char hex `player_token` is issued and stored only in the `monikas_players` row for that player. The client keeps its token in local storage (web) or in-memory (iOS app for M1). All authenticated API routes accept the token via `Authorization: Bearer <token>`.

## RLS summary

All `monikas_*` tables have RLS enabled. Policies:

- **Full write access: service role only** (writes happen in API routes).
- **Read-only catalog tables** (preset avatars, acting modifiers, recap lines, suggestion prompts): anon + authenticated `SELECT`.
- **Room-scoped tables** (rooms, players, turns, cards): anon + authenticated `SELECT` so realtime subscriptions work. Card text leaks are mitigated by **not broadcasting card text via realtime** and instead serving current card via the API only.

## Room code generation

`monikas_generate_room_code()` — Postgres RPC. Generates a 4-char uppercase code from a 24-letter alphabet (skips `I` and `O` to reduce phone/yelling confusion). Retries up to 20 times on collision, then raises.

## Realtime

The `supabase_realtime` publication includes four tables:

- `monikas_rooms`
- `monikas_players`
- `monikas_cards` (metadata only — never use `original_text` in realtime UI)
- `monikas_turns`

`REPLICA IDENTITY FULL` is set on all four so update events carry old+new state.
