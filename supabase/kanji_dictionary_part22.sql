
-- Insert kanji data

INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('蹴', 'kick', ARRAY['shuu', 'ke']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('髄', 'marrow', ARRAY['zui']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('瀬', 'rapids', ARRAY['se']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('藻', 'seaweed', ARRAY['sou', 'mo']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('臓', 'entrails', ARRAY['zou']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('覇', 'hegemony', ARRAY['ha']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('爆', 'explode', ARRAY['baku']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('譜', 'musical score', ARRAY['fu']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('簿', 'register', ARRAY['bo']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('霧', 'fog', ARRAY['mu', 'kiri']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('羅', 'gauze', ARRAY['ra']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('離', 'detach', ARRAY['ri', 'hana']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('麗', 'lovely', ARRAY['rei', 'uruwa']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('麓', 'foot of a mountain', ARRAY['roku', 'fumoto']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('議', 'deliberation', ARRAY['gi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('競', 'compete', ARRAY['kyou', 'kei', 'kiso', 'se']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('響', 'echo', ARRAY['kyou', 'hibi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('懸', 'suspend', ARRAY['ken', 'ka']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('護', 'safeguard', ARRAY['go']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('鐘', 'bell', ARRAY['shou', 'kane']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('譲', 'defer', ARRAY['jou', 'yuzu']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('醸', 'brew', ARRAY['jou', 'kamo']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('籍', 'enroll', ARRAY['seki']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('騰', 'inflation', ARRAY['tou']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('欄', 'column', ARRAY['ran']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('艦', 'warship', ARRAY['kan']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('顧', 'look back', ARRAY['ko', 'kaeri']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('鶴', 'crane', ARRAY['tsuru']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('魔', 'witch', ARRAY['ma']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('躍', 'leap', ARRAY['yaku', 'odo']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('露', 'dew', ARRAY['ro', 'tsuyu']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('驚', 'wonder', ARRAY['kyou', 'odoro']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('襲', 'attack', ARRAY['shuu', 'oso']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('籠', 'basket', ARRAY['rou', 'kago', 'ko']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('鑑', 'specimen', ARRAY['kan', 'kanga']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('鬱', 'gloom', ARRAY['utsu']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;