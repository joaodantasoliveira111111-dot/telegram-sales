CREATE OR REPLACE FUNCTION increment_cloaker_clicks(p_id uuid, p_is_bot boolean)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE cloakers SET
    total_clicks = total_clicks + 1,
    human_clicks = human_clicks + CASE WHEN NOT p_is_bot THEN 1 ELSE 0 END,
    bot_clicks   = bot_clicks   + CASE WHEN p_is_bot     THEN 1 ELSE 0 END
  WHERE id = p_id;
END;
$$;
