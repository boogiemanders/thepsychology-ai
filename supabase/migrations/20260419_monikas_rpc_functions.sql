-- Monikas RPCs. All SECURITY DEFINER so we can safely call them from API routes
-- with any key. Internal logic uses service-role-equivalent access.

-- Generate a fresh, unused 4-letter uppercase room code.
-- 4^26 = ~457k codes. Collisions rare; we retry up to 20 times then raise.
CREATE OR REPLACE FUNCTION monikas_generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ';  -- skip I, O to reduce confusion
  code  TEXT;
  tries INTEGER := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..4 LOOP
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;

    IF NOT EXISTS (SELECT 1 FROM monikas_rooms WHERE room_code = code) THEN
      RETURN code;
    END IF;

    tries := tries + 1;
    IF tries > 20 THEN
      RAISE EXCEPTION 'could not generate unique room code after 20 tries';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION monikas_generate_room_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION monikas_generate_room_code() TO service_role;


-- Create a room + insert the host as player 1 atomically.
-- Returns the room id, room code, and host player token.
CREATE OR REPLACE FUNCTION monikas_create_room(
  p_host_name    TEXT,
  p_timer_seconds INTEGER DEFAULT 60
)
RETURNS TABLE (
  room_id       UUID,
  room_code     TEXT,
  player_id     UUID,
  player_token  TEXT
) AS $$
DECLARE
  v_room_id      UUID;
  v_room_code    TEXT;
  v_player_id    UUID;
  v_player_token TEXT;
BEGIN
  IF p_host_name IS NULL OR char_length(trim(p_host_name)) = 0 THEN
    RAISE EXCEPTION 'host_name required';
  END IF;

  v_room_code    := monikas_generate_room_code();
  v_player_token := encode(extensions.gen_random_bytes(24), 'hex');

  INSERT INTO monikas_rooms (room_code, timer_seconds, status)
  VALUES (v_room_code, p_timer_seconds, 'lobby')
  RETURNING id INTO v_room_id;

  INSERT INTO monikas_players (room_id, player_token, display_name, join_type, turn_order)
  VALUES (v_room_id, v_player_token, trim(p_host_name), 'host_device', 0)
  RETURNING id INTO v_player_id;

  UPDATE monikas_rooms SET host_player_id = v_player_id WHERE id = v_room_id;

  RETURN QUERY SELECT v_room_id, v_room_code, v_player_id, v_player_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION monikas_create_room(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION monikas_create_room(TEXT, INTEGER) TO service_role;


-- Join an existing lobby by code. Returns new player id + token.
CREATE OR REPLACE FUNCTION monikas_join_room(
  p_room_code   TEXT,
  p_display_name TEXT,
  p_join_type   TEXT DEFAULT 'web_player'
)
RETURNS TABLE (
  room_id      UUID,
  player_id    UUID,
  player_token TEXT
) AS $$
DECLARE
  v_room_id      UUID;
  v_status       TEXT;
  v_player_id    UUID;
  v_player_token TEXT;
  v_next_order   INTEGER;
BEGIN
  IF p_display_name IS NULL OR char_length(trim(p_display_name)) = 0 THEN
    RAISE EXCEPTION 'display_name required';
  END IF;

  SELECT id, status INTO v_room_id, v_status
    FROM monikas_rooms WHERE room_code = upper(p_room_code);

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'room not found';
  END IF;
  IF v_status <> 'lobby' THEN
    RAISE EXCEPTION 'room is not accepting joins (status: %)', v_status;
  END IF;

  SELECT COALESCE(MAX(turn_order), -1) + 1 INTO v_next_order
    FROM monikas_players WHERE monikas_players.room_id = v_room_id;

  v_player_token := encode(extensions.gen_random_bytes(24), 'hex');

  INSERT INTO monikas_players (room_id, player_token, display_name, join_type, turn_order)
  VALUES (v_room_id, v_player_token, trim(p_display_name), p_join_type, v_next_order)
  RETURNING id INTO v_player_id;

  RETURN QUERY SELECT v_room_id, v_player_id, v_player_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION monikas_join_room(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION monikas_join_room(TEXT, TEXT, TEXT) TO service_role;
