-- Tokyo Starter Pack: Curated sentence library
-- Domains: Conversations & Emotions, Food & Drink, Technology & Internet
-- Authentic Japanese → English (not translated from English)

-- First, create collections and collection_sentences tables if they don't exist

CREATE TABLE IF NOT EXISTS collections (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  total_sentences INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_sentences (
  id BIGSERIAL PRIMARY KEY,
  collection_id BIGINT REFERENCES collections(id) ON DELETE CASCADE,
  sentence_id BIGINT REFERENCES sentences(id) ON DELETE CASCADE,
  sequence_order INT,
  UNIQUE(collection_id, sentence_id)
);

-- Add subdomain column to sentences table if it doesn't exist
ALTER TABLE sentences ADD COLUMN IF NOT EXISTS subdomain TEXT;

-- Create the Tokyo Starter Pack collection
INSERT INTO collections (name, description, total_sentences)
VALUES (
  'Tokyo Starter Pack',
  'Real Japanese for digital life, eating out, and daily conversation. Your first two weeks in Japan.',
  75
) RETURNING id;

-- Note: After running the above, use the returned collection ID in the collection_sentences inserts below
-- For now, we'll insert sentences and you can link them to the collection afterward


-- ============================================================
-- CONVERSATIONS & EMOTIONS
-- ============================================================

-- Greetings & Introductions (N5)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  'おはよう',
  'Morning! (casual)',
  '[{"word":"おはよう","reading":"おはよう","meaning":"good morning (casual)"}]',
  'N5',
  'Conversations & Emotions',
  'Greetings & introductions'
),
(
  'おはようございます',
  'Good morning (polite)',
  '[{"word":"おはようございます","reading":"おはようございます","meaning":"good morning (polite)"}]',
  'N5',
  'Conversations & Emotions',
  'Greetings & introductions'
),
(
  'こんにちは',
  'Hello / Good afternoon',
  '[{"word":"こんにちは","reading":"こんにちは","meaning":"hello, good afternoon"}]',
  'N5',
  'Conversations & Emotions',
  'Greetings & introductions'
),
(
  'お疲れ様です',
  'Thanks for your hard work (at end of day)',
  '[{"word":"お疲れ様","reading":"おつかれさま","meaning":"thanks for hard work"},{"word":"です","reading":"です","meaning":"polite copula"}]',
  'N5',
  'Conversations & Emotions',
  'Greetings & introductions'
),
(
  'はじめまして',
  'Nice to meet you (first time)',
  '[{"word":"はじめまして","reading":"はじめまして","meaning":"nice to meet you"}]',
  'N5',
  'Conversations & Emotions',
  'Greetings & introductions'
);

-- Saying goodbye (N5)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  'じゃあね',
  'See you (casual)',
  '[{"word":"じゃあね","reading":"じゃあね","meaning":"see you, bye (casual)"}]',
  'N5',
  'Conversations & Emotions',
  'Saying goodbye'
),
(
  'またね',
  'See you later (casual)',
  '[{"word":"またね","reading":"またね","meaning":"see you later"}]',
  'N5',
  'Conversations & Emotions',
  'Saying goodbye'
),
(
  'さようなら',
  'Goodbye (formal, sounds final)',
  '[{"word":"さようなら","reading":"さようなら","meaning":"goodbye"}]',
  'N5',
  'Conversations & Emotions',
  'Saying goodbye'
),
(
  'お先に失礼します',
  'Excuse me for leaving first (workplace)',
  '[{"word":"お先に","reading":"おさきに","meaning":"ahead, before you"},{"word":"失礼","reading":"しつれい","meaning":"rudeness, excuse me"},{"word":"します","reading":"します","meaning":"do (polite)"}]',
  'N4',
  'Conversations & Emotions',
  'Saying goodbye'
),
(
  'また明日',
  'See you tomorrow',
  '[{"word":"また","reading":"また","meaning":"again"},{"word":"明日","reading":"あした","meaning":"tomorrow"}]',
  'N5',
  'Conversations & Emotions',
  'Saying goodbye'
);

-- Apologizing (N5-N4)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  'ごめん',
  'Sorry (casual)',
  '[{"word":"ごめん","reading":"ごめん","meaning":"sorry (casual)"}]',
  'N5',
  'Conversations & Emotions',
  'Apologizing'
),
(
  'ごめんなさい',
  'I''m sorry (polite)',
  '[{"word":"ごめんなさい","reading":"ごめんなさい","meaning":"I''m sorry"}]',
  'N5',
  'Conversations & Emotions',
  'Apologizing'
),
(
  'すみません',
  'Excuse me / I''m sorry',
  '[{"word":"すみません","reading":"すみません","meaning":"excuse me, I''m sorry"}]',
  'N5',
  'Conversations & Emotions',
  'Apologizing'
),
(
  '申し訳ございません',
  'I sincerely apologize (very formal)',
  '[{"word":"申し訳","reading":"もうしわけ","meaning":"apology, excuse"},{"word":"ございません","reading":"ございません","meaning":"do not have (formal)"}]',
  'N3',
  'Conversations & Emotions',
  'Apologizing'
),
(
  '遅れてごめん',
  'Sorry I''m late',
  '[{"word":"遅れて","reading":"おくれて","meaning":"being late"},{"word":"ごめん","reading":"ごめん","meaning":"sorry"}]',
  'N5',
  'Conversations & Emotions',
  'Apologizing'
);

-- Small talk (N5-N4)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  '今日は暑いですね',
  'It''s hot today, isn''t it?',
  '[{"word":"今日","reading":"きょう","meaning":"today"},{"word":"は","reading":"は","meaning":"topic marker"},{"word":"暑い","reading":"あつい","meaning":"hot"},{"word":"ですね","reading":"ですね","meaning":"polite + seeking agreement"}]',
  'N5',
  'Conversations & Emotions',
  'Small talk'
),
(
  '週末どうだった？',
  'How was your weekend?',
  '[{"word":"週末","reading":"しゅうまつ","meaning":"weekend"},{"word":"どう","reading":"どう","meaning":"how"},{"word":"だった","reading":"だった","meaning":"was (past)"}]',
  'N5',
  'Conversations & Emotions',
  'Small talk'
),
(
  '最近どう？',
  'How have you been lately?',
  '[{"word":"最近","reading":"さいきん","meaning":"recently, lately"},{"word":"どう","reading":"どう","meaning":"how"}]',
  'N5',
  'Conversations & Emotions',
  'Small talk'
),
(
  '久しぶり！',
  'Long time no see!',
  '[{"word":"久しぶり","reading":"ひさしぶり","meaning":"long time no see"}]',
  'N4',
  'Conversations & Emotions',
  'Small talk'
),
(
  '元気だった？',
  'Have you been well?',
  '[{"word":"元気","reading":"げんき","meaning":"healthy, energetic"},{"word":"だった","reading":"だった","meaning":"was (past casual)"}]',
  'N5',
  'Conversations & Emotions',
  'Small talk'
);

-- Positive emotions (N5-N4)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  '楽しかった',
  'That was fun',
  '[{"word":"楽しかった","reading":"たのしかった","meaning":"was fun (past)"}]',
  'N5',
  'Conversations & Emotions',
  'Positive emotions'
),
(
  '嬉しい！',
  'I''m happy!',
  '[{"word":"嬉しい","reading":"うれしい","meaning":"happy, glad"}]',
  'N5',
  'Conversations & Emotions',
  'Positive emotions'
),
(
  'やった！',
  'Yes! / I did it!',
  '[{"word":"やった","reading":"やった","meaning":"yes!, I did it!"}]',
  'N5',
  'Conversations & Emotions',
  'Positive emotions'
),
(
  '最高だった',
  'That was the best',
  '[{"word":"最高","reading":"さいこう","meaning":"the best, maximum"},{"word":"だった","reading":"だった","meaning":"was"}]',
  'N4',
  'Conversations & Emotions',
  'Positive emotions'
),
(
  'めっちゃ楽しみ！',
  'I''m super excited!',
  '[{"word":"めっちゃ","reading":"めっちゃ","meaning":"very, super (casual)"},{"word":"楽しみ","reading":"たのしみ","meaning":"looking forward to"}]',
  'N4',
  'Conversations & Emotions',
  'Positive emotions'
);

-- Negative emotions (N5-N4)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  '疲れた',
  'I''m tired',
  '[{"word":"疲れた","reading":"つかれた","meaning":"got tired"}]',
  'N5',
  'Conversations & Emotions',
  'Negative emotions'
),
(
  '眠い',
  'I''m sleepy',
  '[{"word":"眠い","reading":"ねむい","meaning":"sleepy"}]',
  'N5',
  'Conversations & Emotions',
  'Negative emotions'
),
(
  'やばい',
  'Oh no / This is bad / Amazing (depends on context)',
  '[{"word":"やばい","reading":"やばい","meaning":"dangerous, bad, or amazing (slang)"}]',
  'N4',
  'Conversations & Emotions',
  'Negative emotions'
),
(
  'ストレスたまってる',
  'I''m stressed out',
  '[{"word":"ストレス","reading":"すとれす","meaning":"stress"},{"word":"たまってる","reading":"たまってる","meaning":"accumulating"}]',
  'N4',
  'Conversations & Emotions',
  'Stress & pressure'
),
(
  'もう無理',
  'I can''t do this anymore',
  '[{"word":"もう","reading":"もう","meaning":"already, anymore"},{"word":"無理","reading":"むり","meaning":"impossible, can''t"}]',
  'N4',
  'Conversations & Emotions',
  'Negative emotions'
);

-- Agreeing & disagreeing (N5-N4)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  'そうだね',
  'That''s right / I agree',
  '[{"word":"そう","reading":"そう","meaning":"that way, so"},{"word":"だね","reading":"だね","meaning":"right, isn''t it"}]',
  'N5',
  'Conversations & Emotions',
  'Agreeing & disagreeing'
),
(
  'それいいね！',
  'That''s good!',
  '[{"word":"それ","reading":"それ","meaning":"that"},{"word":"いい","reading":"いい","meaning":"good"},{"word":"ね","reading":"ね","meaning":"right?"}]',
  'N5',
  'Conversations & Emotions',
  'Agreeing & disagreeing'
),
(
  'まじで？',
  'Seriously? / For real?',
  '[{"word":"まじで","reading":"まじで","meaning":"seriously, for real (casual)"}]',
  'N4',
  'Conversations & Emotions',
  'Reacting with surprise'
),
(
  'ちょっと違うかな',
  'I think it''s a bit different',
  '[{"word":"ちょっと","reading":"ちょっと","meaning":"a bit, a little"},{"word":"違う","reading":"ちがう","meaning":"different, wrong"},{"word":"かな","reading":"かな","meaning":"I wonder (softener)"}]',
  'N4',
  'Conversations & Emotions',
  'Agreeing & disagreeing'
);

-- Phone & texting (N4-N3)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  '後で連絡するね',
  'I''ll contact you later',
  '[{"word":"後で","reading":"あとで","meaning":"later"},{"word":"連絡","reading":"れんらく","meaning":"contact"},{"word":"する","reading":"する","meaning":"do"},{"word":"ね","reading":"ね","meaning":"okay?"}]',
  'N4',
  'Conversations & Emotions',
  'Phone & texting'
),
(
  '返事遅くなってごめん',
  'Sorry for the late reply',
  '[{"word":"返事","reading":"へんじ","meaning":"reply"},{"word":"遅く","reading":"おそく","meaning":"late"},{"word":"なって","reading":"なって","meaning":"becoming"},{"word":"ごめん","reading":"ごめん","meaning":"sorry"}]',
  'N4',
  'Conversations & Emotions',
  'Phone & texting'
),
(
  '既読無視しないで',
  'Don''t leave me on read',
  '[{"word":"既読","reading":"きどく","meaning":"read receipt"},{"word":"無視","reading":"むし","meaning":"ignore"},{"word":"しないで","reading":"しないで","meaning":"don''t do"}]',
  'N3',
  'Conversations & Emotions',
  'Phone & texting'
);


-- ============================================================
-- FOOD & DRINK
-- ============================================================

-- Restaurants & dining (N5-N4)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  'これください',
  'This one, please (when ordering)',
  '[{"word":"これ","reading":"これ","meaning":"this"},{"word":"ください","reading":"ください","meaning":"please give me"}]',
  'N5',
  'Food & Drink',
  'Restaurants & dining'
),
(
  '水ください',
  'Water, please',
  '[{"word":"水","reading":"みず","meaning":"water"},{"word":"ください","reading":"ください","meaning":"please give me"}]',
  'N5',
  'Food & Drink',
  'Restaurants & dining'
),
(
  'お会計お願いします',
  'Check, please',
  '[{"word":"お会計","reading":"おかいけい","meaning":"the bill"},{"word":"お願いします","reading":"おねがいします","meaning":"please"}]',
  'N5',
  'Food & Drink',
  'Restaurants & dining'
),
(
  '予約してますか？',
  'Do you have a reservation?',
  '[{"word":"予約","reading":"よやく","meaning":"reservation"},{"word":"してます","reading":"してます","meaning":"have done"},{"word":"か","reading":"か","meaning":"question marker"}]',
  'N5',
  'Food & Drink',
  'Restaurants & dining'
),
(
  '何名様ですか？',
  'How many people? (polite)',
  '[{"word":"何名様","reading":"なんめいさま","meaning":"how many people (polite)"},{"word":"ですか","reading":"ですか","meaning":"is it? (polite question)"}]',
  'N4',
  'Food & Drink',
  'Restaurants & dining'
),
(
  'おすすめは何ですか？',
  'What do you recommend?',
  '[{"word":"おすすめ","reading":"おすすめ","meaning":"recommendation"},{"word":"は","reading":"は","meaning":"topic marker"},{"word":"何","reading":"なん","meaning":"what"},{"word":"ですか","reading":"ですか","meaning":"is it?"}]',
  'N5',
  'Food & Drink',
  'Restaurants & dining'
);

-- Food opinions (N5-N4)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  '美味しい！',
  'Delicious!',
  '[{"word":"美味しい","reading":"おいしい","meaning":"delicious"}]',
  'N5',
  'Food & Drink',
  'Food opinions'
),
(
  'いただきます',
  'Thank you for the meal (before eating)',
  '[{"word":"いただきます","reading":"いただきます","meaning":"I humbly receive (said before eating)"}]',
  'N5',
  'Food & Drink',
  'Food opinions'
),
(
  'ごちそうさまでした',
  'Thank you for the meal (after eating)',
  '[{"word":"ごちそうさまでした","reading":"ごちそうさまでした","meaning":"thank you for the meal (after eating)"}]',
  'N5',
  'Food & Drink',
  'Food opinions'
),
(
  'お腹すいた',
  'I''m hungry',
  '[{"word":"お腹","reading":"おなか","meaning":"stomach"},{"word":"すいた","reading":"すいた","meaning":"became empty"}]',
  'N5',
  'Food & Drink',
  'Food opinions'
),
(
  'もう食べられない',
  'I can''t eat anymore / I''m full',
  '[{"word":"もう","reading":"もう","meaning":"already, anymore"},{"word":"食べられない","reading":"たべられない","meaning":"can''t eat"}]',
  'N5',
  'Food & Drink',
  'Food opinions'
),
(
  'これめっちゃうまい',
  'This is so good (casual)',
  '[{"word":"これ","reading":"これ","meaning":"this"},{"word":"めっちゃ","reading":"めっちゃ","meaning":"very, super"},{"word":"うまい","reading":"うまい","meaning":"tasty, good"}]',
  'N4',
  'Food & Drink',
  'Food opinions'
);

-- Cooking at home (N5-N4)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  '今日の夜ご飯何にする？',
  'What should we have for dinner tonight?',
  '[{"word":"今日","reading":"きょう","meaning":"today"},{"word":"の","reading":"の","meaning":"possessive"},{"word":"夜ご飯","reading":"よるごはん","meaning":"dinner"},{"word":"何","reading":"なに","meaning":"what"},{"word":"にする","reading":"にする","meaning":"decide on"}]',
  'N5',
  'Food & Drink',
  'Cooking at home'
),
(
  'カレー作ろうか',
  'Should I make curry?',
  '[{"word":"カレー","reading":"かれー","meaning":"curry"},{"word":"作ろう","reading":"つくろう","meaning":"let''s make"},{"word":"か","reading":"か","meaning":"question marker"}]',
  'N5',
  'Food & Drink',
  'Cooking at home'
),
(
  '冷蔵庫に何も無い',
  'There''s nothing in the fridge',
  '[{"word":"冷蔵庫","reading":"れいぞうこ","meaning":"refrigerator"},{"word":"に","reading":"に","meaning":"in"},{"word":"何も","reading":"なにも","meaning":"nothing"},{"word":"無い","reading":"ない","meaning":"doesn''t exist"}]',
  'N5',
  'Food & Drink',
  'Cooking at home'
);

-- Coffee & cafes (N5-N4)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  'コーヒーいかがですか？',
  'Would you like some coffee?',
  '[{"word":"コーヒー","reading":"こーひー","meaning":"coffee"},{"word":"いかがですか","reading":"いかがですか","meaning":"how about, would you like"}]',
  'N5',
  'Food & Drink',
  'Coffee & cafes'
),
(
  'カフェラテください',
  'Cafe latte, please',
  '[{"word":"カフェラテ","reading":"かふぇらて","meaning":"cafe latte"},{"word":"ください","reading":"ください","meaning":"please give me"}]',
  'N5',
  'Food & Drink',
  'Coffee & cafes'
),
(
  'ここWi-Fi使えますか？',
  'Can I use WiFi here?',
  '[{"word":"ここ","reading":"ここ","meaning":"here"},{"word":"Wi-Fi","reading":"わいふぁい","meaning":"WiFi"},{"word":"使えます","reading":"つかえます","meaning":"can use"},{"word":"か","reading":"か","meaning":"question"}]',
  'N5',
  'Food & Drink',
  'Coffee & cafes'
);

-- Drinking & going out (N4-N3)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  '今日飲みに行かない？',
  'Want to go drinking today?',
  '[{"word":"今日","reading":"きょう","meaning":"today"},{"word":"飲み","reading":"のみ","meaning":"drinking"},{"word":"に","reading":"に","meaning":"to"},{"word":"行かない","reading":"いかない","meaning":"won''t you go"}]',
  'N4',
  'Food & Drink',
  'Drinking & going out'
),
(
  'とりあえずビールで',
  'Beer for now / Start with beer',
  '[{"word":"とりあえず","reading":"とりあえず","meaning":"for now, first of all"},{"word":"ビール","reading":"びーる","meaning":"beer"},{"word":"で","reading":"で","meaning":"with"}]',
  'N4',
  'Food & Drink',
  'Drinking & going out'
),
(
  '酔っ払った',
  'I''m drunk',
  '[{"word":"酔っ払った","reading":"よっぱらった","meaning":"got drunk"}]',
  'N4',
  'Food & Drink',
  'Drinking & going out'
),
(
  '二日酔いがやばい',
  'This hangover is terrible',
  '[{"word":"二日酔い","reading":"ふつかよい","meaning":"hangover"},{"word":"が","reading":"が","meaning":"subject marker"},{"word":"やばい","reading":"やばい","meaning":"terrible, bad"}]',
  'N3',
  'Food & Drink',
  'Drinking & going out'
);

-- Convenience store food (N5-N4)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  'コンビニ行ってくる',
  'I''m going to the convenience store',
  '[{"word":"コンビニ","reading":"こんびに","meaning":"convenience store"},{"word":"行って","reading":"いって","meaning":"going"},{"word":"くる","reading":"くる","meaning":"come back"}]',
  'N5',
  'Food & Drink',
  'Convenience store food'
),
(
  'おにぎり買ってきて',
  'Buy some rice balls and bring them back',
  '[{"word":"おにぎり","reading":"おにぎり","meaning":"rice ball"},{"word":"買って","reading":"かって","meaning":"buy"},{"word":"きて","reading":"きて","meaning":"bring back"}]',
  'N5',
  'Food & Drink',
  'Convenience store food'
),
(
  '温めますか？',
  'Would you like it heated? (at convenience store)',
  '[{"word":"温めます","reading":"あたためます","meaning":"heat up"},{"word":"か","reading":"か","meaning":"question"}]',
  'N5',
  'Food & Drink',
  'Convenience store food'
);


-- ============================================================
-- TECHNOLOGY & INTERNET
-- ============================================================

-- Social media (N4-N3)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  'インスタ見た？',
  'Did you see it on Instagram?',
  '[{"word":"インスタ","reading":"いんすた","meaning":"Instagram"},{"word":"見た","reading":"みた","meaning":"saw"}]',
  'N4',
  'Technology & Internet',
  'Social media'
),
(
  'ツイート消しちゃった',
  'I deleted my tweet',
  '[{"word":"ツイート","reading":"ついーと","meaning":"tweet"},{"word":"消しちゃった","reading":"けしちゃった","meaning":"deleted (with regret)"}]',
  'N4',
  'Technology & Internet',
  'Social media'
),
(
  'いいねしといて',
  'Like it for me',
  '[{"word":"いいね","reading":"いいね","meaning":"like (social media)"},{"word":"しといて","reading":"しといて","meaning":"do for me"}]',
  'N4',
  'Technology & Internet',
  'Social media'
),
(
  'フォローしてね',
  'Follow me',
  '[{"word":"フォロー","reading":"ふぉろー","meaning":"follow"},{"word":"して","reading":"して","meaning":"do"},{"word":"ね","reading":"ね","meaning":"okay?"}]',
  'N4',
  'Technology & Internet',
  'Social media'
),
(
  'バズってる',
  'It''s going viral',
  '[{"word":"バズってる","reading":"ばずってる","meaning":"going viral, buzzing"}]',
  'N3',
  'Technology & Internet',
  'Social media'
);

-- Texting slang (N4-N3)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  'おk',
  'OK (text slang)',
  '[{"word":"おk","reading":"おけー","meaning":"OK (internet slang)"}]',
  'N4',
  'Technology & Internet',
  'Texting slang'
),
(
  'りょ',
  'Got it / Roger (text slang)',
  '[{"word":"りょ","reading":"りょ","meaning":"understood (from りょうかい)"}]',
  'N4',
  'Technology & Internet',
  'Texting slang'
),
(
  'おつ',
  'Thanks / Good work (text slang)',
  '[{"word":"おつ","reading":"おつ","meaning":"thanks (from おつかれさま)"}]',
  'N4',
  'Technology & Internet',
  'Texting slang'
),
(
  'www',
  'Haha / LOL (laughing)',
  '[{"word":"www","reading":"わらわらわら","meaning":"laughing (from 笑)"}]',
  'N4',
  'Technology & Internet',
  'Texting slang'
),
(
  'まじ卍',
  'Seriously crazy / Wild (slang)',
  '[{"word":"まじ卍","reading":"まじまんじ","meaning":"seriously wild (Gen Z slang)"}]',
  'N3',
  'Technology & Internet',
  'Texting slang'
);

-- Apps & games (N4-N3)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  'このゲーム面白い',
  'This game is interesting',
  '[{"word":"この","reading":"この","meaning":"this"},{"word":"ゲーム","reading":"げーむ","meaning":"game"},{"word":"面白い","reading":"おもしろい","meaning":"interesting, fun"}]',
  'N5',
  'Technology & Internet',
  'Apps & games'
),
(
  'アプリ落ちた',
  'The app crashed',
  '[{"word":"アプリ","reading":"あぷり","meaning":"app"},{"word":"落ちた","reading":"おちた","meaning":"crashed, fell"}]',
  'N4',
  'Technology & Internet',
  'Apps & games'
),
(
  'ログインできない',
  'I can''t log in',
  '[{"word":"ログイン","reading":"ろぐいん","meaning":"log in"},{"word":"できない","reading":"できない","meaning":"can''t do"}]',
  'N4',
  'Technology & Internet',
  'Apps & games'
),
(
  'ガチャ回したい',
  'I want to do a gacha pull',
  '[{"word":"ガチャ","reading":"がちゃ","meaning":"gacha (loot box)"},{"word":"回したい","reading":"まわしたい","meaning":"want to spin/pull"}]',
  'N3',
  'Technology & Internet',
  'Apps & games'
);

-- Tech problems (N5-N4)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  '充電切れた',
  'My battery died',
  '[{"word":"充電","reading":"じゅうでん","meaning":"charging, battery"},{"word":"切れた","reading":"きれた","meaning":"ran out"}]',
  'N5',
  'Technology & Internet',
  'Tech problems'
),
(
  'Wi-Fiつながらない',
  'WiFi won''t connect',
  '[{"word":"Wi-Fi","reading":"わいふぁい","meaning":"WiFi"},{"word":"つながらない","reading":"つながらない","meaning":"won''t connect"}]',
  'N5',
  'Technology & Internet',
  'Tech problems'
),
(
  'スマホ忘れた',
  'I forgot my phone',
  '[{"word":"スマホ","reading":"すまほ","meaning":"smartphone"},{"word":"忘れた","reading":"わすれた","meaning":"forgot"}]',
  'N5',
  'Technology & Internet',
  'Tech problems'
),
(
  'パスワード忘れちゃった',
  'I forgot my password',
  '[{"word":"パスワード","reading":"ぱすわーど","meaning":"password"},{"word":"忘れちゃった","reading":"わすれちゃった","meaning":"forgot (with regret)"}]',
  'N5',
  'Technology & Internet',
  'Tech problems'
),
(
  '画面割れた',
  'My screen cracked',
  '[{"word":"画面","reading":"がめん","meaning":"screen"},{"word":"割れた","reading":"われた","meaning":"cracked, broke"}]',
  'N4',
  'Technology & Internet',
  'Tech problems'
);

-- Internet culture (N4-N3)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  'それな',
  'That''s so true / I know right',
  '[{"word":"それな","reading":"それな","meaning":"that''s so true (internet slang)"}]',
  'N4',
  'Technology & Internet',
  'Internet culture'
),
(
  'エモい',
  'Emotional / Gives me feels',
  '[{"word":"エモい","reading":"えもい","meaning":"emotional, nostalgic (from エモーショナル)"}]',
  'N3',
  'Technology & Internet',
  'Internet culture'
),
(
  'ググった',
  'I googled it',
  '[{"word":"ググった","reading":"ぐぐった","meaning":"googled (from Google)"}]',
  'N4',
  'Technology & Internet',
  'Internet culture'
),
(
  'ネタバレ注意',
  'Spoiler warning',
  '[{"word":"ネタバレ","reading":"ねたばれ","meaning":"spoiler"},{"word":"注意","reading":"ちゅうい","meaning":"caution, warning"}]',
  'N4',
  'Technology & Internet',
  'Internet culture'
);

-- Texting / LINE (N5-N4)
INSERT INTO sentences (japanese, english, words, jlpt_level, domain, subdomain) VALUES
(
  'LINE送って',
  'Send me a LINE message',
  '[{"word":"LINE","reading":"らいん","meaning":"LINE app"},{"word":"送って","reading":"おくって","meaning":"send"}]',
  'N5',
  'Technology & Internet',
  'Apps & games'
),
(
  'メール見た？',
  'Did you see my email?',
  '[{"word":"メール","reading":"めーる","meaning":"email"},{"word":"見た","reading":"みた","meaning":"saw"}]',
  'N5',
  'Technology & Internet',
  'Apps & games'
),
(
  '既読ついてるよ',
  'It shows you read it',
  '[{"word":"既読","reading":"きどく","meaning":"read receipt"},{"word":"ついてる","reading":"ついてる","meaning":"attached, showing"},{"word":"よ","reading":"よ","meaning":"you know"}]',
  'N4',
  'Technology & Internet',
  'Texting slang'
),
(
  'スタンプ送っとく',
  'I''ll send a sticker',
  '[{"word":"スタンプ","reading":"すたんぷ","meaning":"sticker, stamp"},{"word":"送っとく","reading":"おくっとく","meaning":"send in advance"}]',
  'N4',
  'Technology & Internet',
  'Texting slang'
);


-- ============================================================
-- COLLECTION LINKING
-- After running all the sentence inserts above, get the collection_id
-- from the collections table and link all sentences:
-- ============================================================

-- Run this after all sentences are inserted:
-- Replace {collection_id} with the actual ID from the collections table

/*
WITH ordered_sentences AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as seq
  FROM sentences
  WHERE created_at > (SELECT created_at FROM collections WHERE name = 'Tokyo Starter Pack')
)
INSERT INTO collection_sentences (collection_id, sentence_id, sequence_order)
SELECT
  (SELECT id FROM collections WHERE name = 'Tokyo Starter Pack'),
  id,
  seq
FROM ordered_sentences;
*/
