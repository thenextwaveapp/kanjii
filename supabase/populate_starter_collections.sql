-- Populate starter collections with actual sentences from database
-- Run this after add_collections.sql migration

-- Clear existing data first (in case you're re-running)
DELETE FROM lesson_sentences;
DELETE FROM lessons;
DELETE FROM collections;

-- Create Collections
INSERT INTO collections (id, name, description, emoji, level, order_index) VALUES
  ('c1', 'Restaurant Survival', 'Order food and navigate menus with confidence', '🍜', 'N5', 1),
  ('c2', 'Work Basics', 'Essential office and business phrases', '💼', 'N4', 2),
  ('c3', 'Daily Conversations', 'Small talk and everyday situations', '💬', 'N5', 3)
ON CONFLICT (name) DO NOTHING;

-- Create Lessons for Restaurant Survival
INSERT INTO lessons (id, collection_id, name, description, order_index) VALUES
  ('l1', 'c1', 'Ordering Food', 'Basic ordering phrases', 1),
  ('l2', 'c1', 'At the Counter', 'Paying and requesting items', 2),
  ('l3', 'c1', 'Menu Items', 'Understanding what you are eating', 3);

-- Create Lessons for Work Basics
INSERT INTO lessons (id, collection_id, name, description, order_index) VALUES
  ('l4', 'c2', 'Greetings & Intros', 'First impressions at work', 1),
  ('l5', 'c2', 'Office Small Talk', 'Chat with colleagues', 2),
  ('l6', 'c2', 'Phone Calls', 'Answering and making calls', 3);

-- Create Lessons for Daily Conversations
INSERT INTO lessons (id, collection_id, name, description, order_index) VALUES
  ('l7', 'c3', 'Weather Talk', 'Commenting on the weather', 1),
  ('l8', 'c3', 'Making Plans', 'Suggesting activities', 2),
  ('l9', 'c3', 'Shopping', 'Basic shopping phrases', 3);

-- Populate Restaurant Survival lessons with actual sentences
WITH food_sentences AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM sentences
  WHERE domain LIKE 'Food & drink: Restaurants%'
  LIMIT 15
)
INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
SELECT 'l1', id, rn FROM food_sentences WHERE rn <= 5
UNION ALL
SELECT 'l2', id, rn - 5 FROM food_sentences WHERE rn > 5 AND rn <= 10
UNION ALL
SELECT 'l3', id, rn - 10 FROM food_sentences WHERE rn > 10;

-- Populate Work Basics lessons
WITH work_intros AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM sentences
  WHERE domain LIKE 'Work: Business Cards%' OR domain LIKE 'Work: Greetings%'
  LIMIT 5
),
work_smalltalk AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM sentences
  WHERE domain LIKE 'Work: Office Small Talk%'
  LIMIT 5
),
work_phone AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM sentences
  WHERE domain LIKE 'Work: Phone Calls%'
  LIMIT 5
)
INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
SELECT 'l4', id, rn FROM work_intros
UNION ALL
SELECT 'l5', id, rn FROM work_smalltalk
UNION ALL
SELECT 'l6', id, rn FROM work_phone;

-- Populate Daily Conversations lessons
WITH weather_sentences AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM sentences
  WHERE domain LIKE 'Weather & seasons%'
  LIMIT 5
),
social_sentences AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM sentences
  WHERE domain LIKE 'Relationships: Friends%' OR domain LIKE 'Daily life%'
  LIMIT 5
),
shopping_sentences AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM sentences
  WHERE domain LIKE 'Shopping%'
  LIMIT 5
)
INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
SELECT 'l7', id, rn FROM weather_sentences
UNION ALL
SELECT 'l8', id, rn FROM social_sentences
UNION ALL
SELECT 'l9', id, rn FROM shopping_sentences;

-- Show results
SELECT
  c.name as collection,
  l.name as lesson,
  COUNT(ls.id) as sentence_count
FROM collections c
JOIN lessons l ON l.collection_id = c.id
LEFT JOIN lesson_sentences ls ON ls.lesson_id = l.id
GROUP BY c.name, l.name, c.order_index, l.order_index
ORDER BY c.order_index, l.order_index;
