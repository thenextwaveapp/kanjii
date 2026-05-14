-- Function to search kanji by readings (hiragana/katakana/romaji)
CREATE OR REPLACE FUNCTION search_kanji_readings(search_query TEXT)
RETURNS TABLE (kanji TEXT, meanings TEXT[], readings TEXT[]) AS $$
BEGIN
  RETURN QUERY
  SELECT k.kanji, k.meanings, k.readings
  FROM kanji_dictionary k
  WHERE EXISTS (
    SELECT 1 FROM unnest(k.readings) r
    WHERE r ILIKE '%' || search_query || '%'
  ) OR EXISTS (
    SELECT 1 FROM unnest(k.readings_romaji) r
    WHERE r ILIKE '%' || search_query || '%'
  )
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;
