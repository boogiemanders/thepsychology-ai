# Monikas — Game Engine

State machine and event taxonomy. This doc is a forward-looking sketch for Milestones 3+; Milestone 1 only implements the `room_created` / `player_joined` transitions.

## Authoritative source

The backend is always the source of truth. iOS and web clients mutate by calling `/api/monikas/*` routes. Clients never update Supabase rows directly. Rationale:

- Resume must work across devices, so state can't live only in memory.
- Host-side cheating (e.g. extra Got It taps) is rare but easy to prevent.
- Android/future clients share the same rules if they share the same endpoint.

## Room lifecycle

```
lobby → in_progress → paused → in_progress → completed
                    ↘__________↗
```

- `lobby`: joinable. Card submission, avatar selection, modifier toggles happen here.
- `in_progress`: a turn is active.
- `paused`: host pressed pause. No timer, no writes from actor controls.
- `completed`: all rounds done, greatest-hits shown, room archived (not deleted).

## Round structure

Monikers-style: 3 rounds replay the same deck.

- **Round 1** — free description. Full sentence clues allowed.
- **Round 2** — one word per clue. Actor picks the word.
- **Round 3** — act only. No sound.

At the end of each round the deck resets: every card moves back to `unplayed`. Cards keep their `is_legend`, `is_broke_the_room`, `callback_eligible`, and `secret_note` state across rounds.

## Domain events

Defined as the `MonikasEvent` union in `src/lib/monikas/types.ts`. Not all are wired yet.

```
room_created · player_joined · player_reconnected
avatar_selected · avatar_drawn
card_submitted · fallback_cards_added · deck_shuffled
game_started · turn_started · card_guessed · card_skipped · clue_requested
quote_saved · legend_vote_cast · broke_the_room_marked
recap_line_selected · turn_ended
round_recap_generated · round_advanced
callback_card_inserted · sudden_death_started
game_paused · game_resumed · game_saved · game_completed
```

## Snapshotting

After any event that meaningfully mutates state (turn_ended, round_advanced, game_paused, callback_card_inserted), the engine writes a row to `monikas_room_snapshots` with the full state serialized to JSONB. Resume loads the most recent snapshot.

## Callback mode

Lightweight: a handful of cards marked `is_legend` or `is_broke_the_room` are tagged `callback_eligible`. During later rounds, the deck-draw logic randomly inserts one eligible callback card with low frequency. The dramatic reveal UI (zoomed avatar, serious type, big "THE CARD RETURNS" headline) marks when a callback card is up.

## Sudden death

Optional final round. Composed only of cards marked `is_legend` or `is_broke_the_room`. Format is either one-word or act-only depending on the configuration. Timer is shorter. Pure fan-service round — ideally the funniest few minutes of the night.

## AI clues

Opt-in helper. The actor can tap "Explain" on the private controller. The backend:

1. Pulls the card text.
2. Sends to an LLM via `/api/monikas/clues` with a strict system prompt: generate a short clue that does not contain the answer, does not spell it, does not moralize, does not sanitize.
3. Logs the attempt to `monikas_clue_requests`.
4. Returns the clue — or `null` on failure, in which case the actor just moves on.

Game never blocks on the clue.
