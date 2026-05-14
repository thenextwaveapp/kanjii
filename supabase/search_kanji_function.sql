-- Function to search kanji by meanings array (prioritize exact matches)
CREATE OR REPLACE FUNCTION search_kanji_meanings(search_query TEXT)
RETURNS TABLE (kanji TEXT, meanings TEXT[], readings TEXT[], relevance INT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.kanji,
    k.meanings,
    k.readings,
    CASE
      -- Exact match (highest priority)
      WHEN EXISTS (
        SELECT 1 FROM unnest(k.meanings) m
        WHERE LOWER(m) = LOWER(search_query)
      ) THEN 1
      -- Starts with query (medium priority)
      WHEN EXISTS (
        SELECT 1 FROM unnest(k.meanings) m
        WHERE LOWER(m) LIKE LOWER(search_query) || '%'
      ) THEN 2
      -- Contains query (lowest priority)
      ELSE 3
    END as relevance
  FROM kanji_dictionary k
  WHERE EXISTS (
    SELECT 1 FROM unnest(k.meanings) m
    WHERE m ILIKE '%' || search_query || '%'
  )
  ORDER BY relevance, k.kanji
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;
