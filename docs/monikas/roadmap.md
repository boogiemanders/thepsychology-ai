# Monikas — Roadmap

Milestone 1 shipped the foundation. What's left, in execution order.

## Milestone 2 — Lobby + avatars + card submission

- Avatar picker (preset list from `monikas_preset_avatars`)
- Avatar doodle on iPhone using `PKCanvasView` (square, simple brush, eraser, undo, clear, save)
- Web avatar canvas (simple HTML5 canvas, same tools)
- Card submission (5 cards per player + optional secret note)
- Truth-based suggestion prompts shown during submission (from `monikas_card_suggestion_prompts`)
- Fallback deck fill when total submissions are below threshold
- Deck shuffle via a Postgres RPC `monikas_start_game(room_id)`
- Switch iOS lobby from polling to **Supabase Realtime** (use `supabase-swift` SDK, subscribe to `room:<id>` channel)

## Milestone 3 — Playable local game

- Public display view (timer, actor avatar, team, round, cards remaining)
- Private controller view (current card, Got It, Skip, Explain, Pause, Quit/Save)
- Server-authoritative turn advancement
- Score tracking per team
- Round summary view on the TV

## Milestone 4 — Funny layer 1

- Quote capture sheet after a turn
- Legend voting (per player, limited votes per game)
- Broke-the-room vote
- Secret note reveal during recap after cards are guessed
- Fake awards data model + final awards screen
- Timer tension cues (haptics + sound near the end of a turn)
- Short recap lines tied to turn outcomes (from `monikas_recap_lines`)

## Milestone 5 — Persistence + recovery

- `monikas_room_snapshots` writes on every meaningful state change
- Host pause + quit-and-save
- Resume flow (restores deck order, scores, actor, timer config, avatars, legend state, callback state, quotes)
- Reconnect for dropped players

## Milestone 6 — Multi-round Monikers structure

- Round 2 one-word mode
- Round 3 act-only mode
- Deck reset between rounds preserving `is_legend` / `secret_note` / `callback_eligible`
- Round-level recaps on TV

## Milestone 7 — Funny layer 2

- Character commitment prompts (from `monikas_acting_modifiers`) shown on TV + controller
- Callback mode — low-frequency re-entry of legendary cards later in the game
- Dramatic legend reveal (zoomed avatar, serious typography, big "THE CARD RETURNS" headline)
- Sudden death legend round

## Milestone 8 — Web player support

- Web join already exists (M1) — extend to full controller mode
- Web card submission with secret notes and suggestions
- Web avatar canvas
- Optional quote / legend voting participation

## Milestone 9 — AI clues

- Backend endpoint `POST /api/monikas/clues`
- Provider abstraction (swap OpenAI / Anthropic / local)
- Safe failure behavior (no censorship, no moralization, no exact answer leak)
- Private clue display on the actor's phone only

## Milestone 10 — Accessibility + polish

- Large-text / dynamic-type support
- VoiceOver labels for all controls
- Reduced-motion option for TV display
- Color-blind-safe palette for TV
- Better empty/error states

## Post-MVP (v2)

- Saved decks across games
- Recurring rooms / friends list
- Profiles + persistent avatars
- Recap export (TikTok-friendly clips)
- Downloadable prompt packs (themed acting packs, holiday packs)
- Android host app (reuse `monikas_*` schema + shared API)
- tvOS app (optional)
- SharePlay (optional — likely replaced by our AirPlay path)
