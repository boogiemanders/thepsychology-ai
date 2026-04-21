-- Enable Supabase Realtime on the four tables the lobby / game view actually cares about.
-- quotes, card_votes, clues, snapshots are fetched on demand to keep payloads small.

DO $$
BEGIN
  -- Create publication if missing (Supabase ships `supabase_realtime` by default).
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END$$;

ALTER PUBLICATION supabase_realtime ADD TABLE monikas_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE monikas_players;
ALTER PUBLICATION supabase_realtime ADD TABLE monikas_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE monikas_turns;

-- REPLICA IDENTITY FULL so update events carry old+new row state (needed for UI diffs).
ALTER TABLE monikas_rooms   REPLICA IDENTITY FULL;
ALTER TABLE monikas_players REPLICA IDENTITY FULL;
ALTER TABLE monikas_cards   REPLICA IDENTITY FULL;
ALTER TABLE monikas_turns   REPLICA IDENTITY FULL;
