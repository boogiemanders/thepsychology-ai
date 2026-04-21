-- Monikas party game — core schema (15 tables)
-- iPhone hosts, TV displays, players join by room code or QR.
-- All writes go through API routes with service role; clients never touch tables directly.

-- Rooms: one per active game session.
CREATE TABLE monikas_rooms (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code                TEXT NOT NULL UNIQUE,
  status                   TEXT NOT NULL DEFAULT 'lobby'
                             CHECK (status IN ('lobby','in_progress','paused','completed')),
  host_player_id           UUID,  -- FK added after monikas_players exists
  timer_seconds            INTEGER NOT NULL DEFAULT 60 CHECK (timer_seconds BETWEEN 10 AND 300),
  current_round            INTEGER NOT NULL DEFAULT 1 CHECK (current_round BETWEEN 1 AND 3),
  current_team             INTEGER NOT NULL DEFAULT 1 CHECK (current_team BETWEEN 1 AND 4),
  current_turn_index       INTEGER NOT NULL DEFAULT 0,
  active_actor_player_id   UUID,
  public_display_connected BOOLEAN NOT NULL DEFAULT false,
  character_mode_enabled   BOOLEAN NOT NULL DEFAULT false,
  callback_mode_enabled    BOOLEAN NOT NULL DEFAULT false,
  sudden_death_enabled     BOOLEAN NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monikas_rooms_code ON monikas_rooms (room_code);
CREATE INDEX idx_monikas_rooms_status ON monikas_rooms (status);

-- Players: one per participant per room. Identity is a token, not an account.
CREATE TABLE monikas_players (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id                UUID NOT NULL REFERENCES monikas_rooms(id) ON DELETE CASCADE,
  player_token           TEXT NOT NULL UNIQUE,  -- opaque secret used by client for auth
  display_name           TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  join_type              TEXT NOT NULL DEFAULT 'host_device'
                           CHECK (join_type IN ('host_device','web_player')),
  team                   INTEGER NOT NULL DEFAULT 1 CHECK (team BETWEEN 1 AND 4),
  turn_order             INTEGER NOT NULL DEFAULT 0,
  is_connected           BOOLEAN NOT NULL DEFAULT true,
  last_seen_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  avatar_type            TEXT CHECK (avatar_type IN ('preset','drawing','preset_plus_drawing')),
  preset_avatar_id       UUID,  -- FK added below
  avatar_image_url       TEXT,
  legend_votes_remaining INTEGER NOT NULL DEFAULT 3,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monikas_players_room ON monikas_players (room_id);
CREATE INDEX idx_monikas_players_token ON monikas_players (player_token);

-- Wire up the circular FKs from rooms to players.
ALTER TABLE monikas_rooms
  ADD CONSTRAINT monikas_rooms_host_fk
    FOREIGN KEY (host_player_id) REFERENCES monikas_players(id) ON DELETE SET NULL,
  ADD CONSTRAINT monikas_rooms_actor_fk
    FOREIGN KEY (active_actor_player_id) REFERENCES monikas_players(id) ON DELETE SET NULL;

-- Cards: user-submitted or fallback-filled. Scoped to one room.
CREATE TABLE monikas_cards (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id                 UUID NOT NULL REFERENCES monikas_rooms(id) ON DELETE CASCADE,
  submitted_by_player_id  UUID REFERENCES monikas_players(id) ON DELETE SET NULL,
  original_text           TEXT NOT NULL CHECK (char_length(original_text) BETWEEN 1 AND 280),
  normalized_text         TEXT NOT NULL,
  secret_note             TEXT CHECK (secret_note IS NULL OR char_length(secret_note) <= 200),
  source_type             TEXT NOT NULL DEFAULT 'user' CHECK (source_type IN ('user','fallback')),
  deck_order              INTEGER NOT NULL DEFAULT 0,
  lifecycle_state         TEXT NOT NULL DEFAULT 'unplayed'
                            CHECK (lifecycle_state IN ('unplayed','guessed','skipped','removed')),
  guessed_by_team         INTEGER CHECK (guessed_by_team IS NULL OR guessed_by_team BETWEEN 1 AND 4),
  round_number_last_seen  INTEGER CHECK (round_number_last_seen IS NULL OR round_number_last_seen BETWEEN 1 AND 3),
  is_legend               BOOLEAN NOT NULL DEFAULT false,
  is_broke_the_room       BOOLEAN NOT NULL DEFAULT false,
  callback_eligible       BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monikas_cards_room ON monikas_cards (room_id);
CREATE INDEX idx_monikas_cards_room_lifecycle ON monikas_cards (room_id, lifecycle_state);
CREATE INDEX idx_monikas_cards_deck_order ON monikas_cards (room_id, deck_order);

-- Turns: one per actor-turn. Used for recap, analytics, funny layer tie-ins.
CREATE TABLE monikas_turns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id               UUID NOT NULL REFERENCES monikas_rooms(id) ON DELETE CASCADE,
  player_id             UUID NOT NULL REFERENCES monikas_players(id) ON DELETE CASCADE,
  round_number          INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 3),
  team                  INTEGER NOT NULL CHECK (team BETWEEN 1 AND 4),
  active_modifier_id    UUID,  -- FK added below
  recap_line_code       TEXT,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at              TIMESTAMPTZ,
  cards_guessed_count   INTEGER NOT NULL DEFAULT 0,
  cards_skipped_count   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_monikas_turns_room ON monikas_turns (room_id);
CREATE INDEX idx_monikas_turns_room_round ON monikas_turns (room_id, round_number);

-- Snapshots: append-only state JSON so we can resume cleanly after disconnect.
CREATE TABLE monikas_room_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID NOT NULL REFERENCES monikas_rooms(id) ON DELETE CASCADE,
  snapshot_json JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monikas_snapshots_room ON monikas_room_snapshots (room_id, created_at DESC);

-- Clue requests: optional AI-generated helper text for the active actor only.
CREATE TABLE monikas_clue_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id                 UUID NOT NULL REFERENCES monikas_rooms(id) ON DELETE CASCADE,
  card_id                 UUID NOT NULL REFERENCES monikas_cards(id) ON DELETE CASCADE,
  requested_by_player_id  UUID REFERENCES monikas_players(id) ON DELETE SET NULL,
  clue_text               TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monikas_clues_room ON monikas_clue_requests (room_id);

-- Fallback decks: curated cards used to fill low-submission rooms.
CREATE TABLE monikas_fallback_decks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE monikas_fallback_deck_cards (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fallback_deck_id   UUID NOT NULL REFERENCES monikas_fallback_decks(id) ON DELETE CASCADE,
  text               TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 280),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monikas_fallback_deck_cards_deck ON monikas_fallback_deck_cards (fallback_deck_id);

-- Preset avatars: curated starter avatars players can pick or draw on top of.
CREATE TABLE monikas_preset_avatars (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wire the players preset-avatar FK now that the table exists.
ALTER TABLE monikas_players
  ADD CONSTRAINT monikas_players_preset_avatar_fk
    FOREIGN KEY (preset_avatar_id) REFERENCES monikas_preset_avatars(id) ON DELETE SET NULL;

-- Quotes: manual text entries saved after a turn. No audio, no transcription.
CREATE TABLE monikas_quotes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id                 UUID NOT NULL REFERENCES monikas_rooms(id) ON DELETE CASCADE,
  turn_id                 UUID REFERENCES monikas_turns(id) ON DELETE SET NULL,
  quote_text              TEXT NOT NULL CHECK (char_length(quote_text) BETWEEN 1 AND 280),
  speaker_name            TEXT CHECK (speaker_name IS NULL OR char_length(speaker_name) <= 40),
  submitted_by_player_id  UUID REFERENCES monikas_players(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monikas_quotes_room ON monikas_quotes (room_id);

-- Card votes: legend / broke_the_room votes. One per (room, card, player, vote_type).
CREATE TABLE monikas_card_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES monikas_rooms(id) ON DELETE CASCADE,
  card_id    UUID NOT NULL REFERENCES monikas_cards(id) ON DELETE CASCADE,
  player_id  UUID NOT NULL REFERENCES monikas_players(id) ON DELETE CASCADE,
  vote_type  TEXT NOT NULL CHECK (vote_type IN ('legend','broke_the_room')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, card_id, player_id, vote_type)
);

CREATE INDEX idx_monikas_card_votes_card ON monikas_card_votes (card_id);

-- Acting modifiers: curated character/impression/mood prompts.
CREATE TABLE monikas_acting_modifiers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL CHECK (category IN ('character','impression','costume','mood')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wire the turns active-modifier FK now that the table exists.
ALTER TABLE monikas_turns
  ADD CONSTRAINT monikas_turns_modifier_fk
    FOREIGN KEY (active_modifier_id) REFERENCES monikas_acting_modifiers(id) ON DELETE SET NULL;

-- Round recaps: per-round summary JSON (hardest card, fastest guess, etc.).
CREATE TABLE monikas_round_recaps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID NOT NULL REFERENCES monikas_rooms(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 3),
  recap_json   JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, round_number)
);

-- Recap lines: short roast-style tags triggered by turn outcomes.
CREATE TABLE monikas_recap_lines (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT NOT NULL UNIQUE,
  label        TEXT NOT NULL,
  trigger_type TEXT NOT NULL
                 CHECK (trigger_type IN (
                   'many_skips','zero_guesses','fast_success',
                   'total_panic','obvious_misplay','miracle_comeback'
                 )),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monikas_recap_lines_trigger ON monikas_recap_lines (trigger_type) WHERE is_active;

-- Card suggestion prompts: truth-based inspiration shown during submission.
CREATE TABLE monikas_card_suggestion_prompts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text       TEXT NOT NULL,
  category   TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger for rooms (simple; extend later if needed).
CREATE OR REPLACE FUNCTION monikas_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER monikas_rooms_touch_updated_at
  BEFORE UPDATE ON monikas_rooms
  FOR EACH ROW EXECUTE FUNCTION monikas_touch_updated_at();
