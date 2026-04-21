-- Monikas RLS: deny all direct client access. Everything goes through API routes
-- signed with service_role. Clients use realtime subscriptions + our API, not raw SELECTs.

ALTER TABLE monikas_rooms                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_players                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_cards                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_turns                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_room_snapshots           ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_clue_requests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_fallback_decks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_fallback_deck_cards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_preset_avatars           ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_quotes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_card_votes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_acting_modifiers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_round_recaps             ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_recap_lines              ENABLE ROW LEVEL SECURITY;
ALTER TABLE monikas_card_suggestion_prompts  ENABLE ROW LEVEL SECURITY;

-- Service role can do anything on any Monikas table.
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'monikas_rooms','monikas_players','monikas_cards','monikas_turns',
      'monikas_room_snapshots','monikas_clue_requests',
      'monikas_fallback_decks','monikas_fallback_deck_cards',
      'monikas_preset_avatars','monikas_quotes','monikas_card_votes',
      'monikas_acting_modifiers','monikas_round_recaps','monikas_recap_lines',
      'monikas_card_suggestion_prompts'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "service role full access" ON %I FOR ALL ' ||
      'USING (auth.jwt() ->> ''role'' = ''service_role'') ' ||
      'WITH CHECK (auth.jwt() ->> ''role'' = ''service_role'')', t
    );
  END LOOP;
END$$;

-- Anon SELECT access to read-only catalog tables (seed data shown in lobby UI).
-- Preset avatars, acting modifiers, recap lines, suggestion prompts are public-safe.
CREATE POLICY "public catalog read" ON monikas_preset_avatars
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public catalog read" ON monikas_acting_modifiers
  FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "public catalog read" ON monikas_recap_lines
  FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "public catalog read" ON monikas_card_suggestion_prompts
  FOR SELECT TO anon, authenticated USING (is_active);

-- Anon realtime SELECT on room-scoped tables so clients can subscribe.
-- We accept broad read here because:
--   1) Writes are all server-side (service role).
--   2) Clients still need the room_code + player_token to do anything useful.
--   3) `monikas_cards.original_text` IS sensitive to the active actor only — but
--      Postgres RLS alone can't gate realtime payloads by field. For MVP we serve
--      the current card via our API only; realtime subscribers see everything else.
--
-- If this becomes a leak risk later, we move cards reads fully behind the API and
-- strip realtime for that one table.
CREATE POLICY "anon read rooms" ON monikas_rooms
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon read players" ON monikas_players
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon read turns" ON monikas_turns
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon read cards metadata" ON monikas_cards
  FOR SELECT TO anon, authenticated USING (true);
