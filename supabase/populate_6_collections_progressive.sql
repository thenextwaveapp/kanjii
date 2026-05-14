-- Progressive Japanese Learning Collections
-- 6 Collections: Foundations → Daily Life → Work & Social → Culture & Fun → Travel & Adventure → Adult Systems
-- Each collection has 5-7 lessons building from vocabulary to context

-- ============================================
-- COLLECTION 1: FOUNDATIONS (N5)
-- Building blocks: greetings, numbers, basic nouns
-- ============================================

INSERT INTO collections (name, description, emoji, level, order_index) VALUES
('Foundations', 'Essential Japanese basics: greetings, numbers, time, family, and simple daily phrases', '🔤', 'N5', 1);

-- Get the collection ID for Foundations
DO $$
DECLARE
    foundations_id uuid;
    daily_life_id uuid;
    work_social_id uuid;
    culture_fun_id uuid;
    travel_id uuid;
    adult_systems_id uuid;
    lesson_id uuid;
BEGIN
    SELECT id INTO foundations_id FROM collections WHERE name = 'Foundations';

    -- Lesson 1.1: Greetings & Basic Phrases
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (foundations_id, 'Greetings & Farewells', 'Essential phrases for daily interactions: hello, goodbye, thank you', 1)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY created_at)
    FROM sentences
    WHERE domain LIKE '%Greetings%' AND (jlpt_level = 'N5' OR jlpt_level IS NULL)
    LIMIT 15;

    -- Lesson 1.2: Numbers & Counting
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (foundations_id, 'Numbers & Counting', 'Counting things, telling prices, and basic numbers', 2)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY created_at)
    FROM sentences
    WHERE domain LIKE '%Numbers%' AND jlpt_level = 'N5'
    LIMIT 15;

    -- Lesson 1.3: Time & Dates
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (foundations_id, 'Time & Dates', 'Telling time, days of the week, and basic scheduling', 3)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY created_at)
    FROM sentences
    WHERE domain LIKE '%Time%' AND jlpt_level = 'N5'
    LIMIT 15;

    -- Lesson 1.4: Family & People
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (foundations_id, 'Family & People', 'Talking about family members and describing people', 4)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY created_at)
    FROM sentences
    WHERE domain LIKE '%Family%' AND jlpt_level = 'N5'
    LIMIT 15;

    -- Lesson 1.5: Self-Introduction
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (foundations_id, 'Introducing Yourself', 'Basic self-introduction: name, age, hometown, hobbies', 5)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY created_at)
    FROM sentences
    WHERE domain LIKE '%Self-Introduction%' AND jlpt_level = 'N5'
    LIMIT 15;

    -- ============================================
    -- COLLECTION 2: DAILY LIFE (N5-N4)
    -- Common situations: food, transport, housing
    -- ============================================

    INSERT INTO collections (name, description, emoji, level, order_index) VALUES
    ('Daily Life', 'Navigate everyday situations: restaurants, shopping, transportation, and home life', '🏠', 'N4', 2)
    RETURNING id INTO daily_life_id;

    -- Lesson 2.1: At Restaurants
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (daily_life_id, 'Eating Out', 'Ordering food, asking for recommendations, paying the bill', 1)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE domain LIKE '%Restaurants%' AND (jlpt_level IN ('N5', 'N4') OR jlpt_level IS NULL)
    LIMIT 20;

    -- Lesson 2.2: Food & Cooking
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (daily_life_id, 'Cooking at Home', 'Kitchen vocabulary, recipes, and cooking instructions', 2)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE domain LIKE '%Cooking%' AND (jlpt_level IN ('N5', 'N4') OR jlpt_level IS NULL)
    LIMIT 20;

    -- Lesson 2.3: Shopping & Groceries
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (daily_life_id, 'Shopping Essentials', 'At the supermarket, convenience store, and markets', 3)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Groceries%' OR domain LIKE '%Convenience Store%')
    AND (jlpt_level IN ('N5', 'N4') OR jlpt_level IS NULL)
    LIMIT 20;

    -- Lesson 2.4: Getting Around
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (daily_life_id, 'Transportation Basics', 'Trains, buses, taxis, and asking for directions', 4)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Trains%' OR domain LIKE '%Buses%' OR domain LIKE '%Directions%')
    AND (jlpt_level IN ('N5', 'N4') OR jlpt_level IS NULL)
    LIMIT 20;

    -- Lesson 2.5: Home & Housing
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (daily_life_id, 'At Home', 'Daily routines, household chores, and apartment life', 5)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Morning Routine%' OR domain LIKE '%Evening Routine%' OR domain LIKE '%Cleaning%')
    AND (jlpt_level IN ('N5', 'N4') OR jlpt_level IS NULL)
    LIMIT 20;

    -- Lesson 2.6: Weather & Seasons
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (daily_life_id, 'Weather Talk', 'Discussing weather, seasons, and natural events', 6)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE domain LIKE '%Weather%' AND (jlpt_level IN ('N5', 'N4') OR jlpt_level IS NULL)
    LIMIT 20;

    -- ============================================
    -- COLLECTION 3: WORK & SOCIAL (N4-N3)
    -- Professional and social contexts
    -- ============================================

    INSERT INTO collections (name, description, emoji, level, order_index) VALUES
    ('Work & Social', 'Professional communication, school life, and building relationships', '💼', 'N3', 3)
    RETURNING id INTO work_social_id;

    -- Lesson 3.1: Office Basics
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (work_social_id, 'Office Conversations', 'Small talk, greetings, and casual workplace chat', 1)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE domain LIKE '%Office Small Talk%' AND jlpt_level IN ('N4', 'N3')
    LIMIT 20;

    -- Lesson 3.2: Meetings & Communication
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (work_social_id, 'Professional Communication', 'Meetings, emails, phone calls, and business introductions', 2)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Meetings%' OR domain LIKE '%Email%' OR domain LIKE '%Phone Calls%' OR domain LIKE '%Business Cards%')
    AND jlpt_level IN ('N4', 'N3')
    LIMIT 25;

    -- Lesson 3.3: School Life
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (work_social_id, 'Student Life', 'Classroom, homework, exams, and school activities', 3)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE domain LIKE '%School%' AND jlpt_level IN ('N4', 'N3')
    LIMIT 20;

    -- Lesson 3.4: Making Friends
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (work_social_id, 'Social Connections', 'Making friends, hanging out, and casual conversations', 4)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Dating%' OR domain LIKE '%Nightlife%') AND jlpt_level IN ('N4', 'N3')
    LIMIT 20;

    -- Lesson 3.5: Relationships
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (work_social_id, 'Romance & Relationships', 'Dating, confessions, and romantic relationships', 5)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Confessions%' OR domain LIKE '%Breakups%' OR domain LIKE '%Marriage%')
    AND jlpt_level IN ('N4', 'N3')
    LIMIT 20;

    -- ============================================
    -- COLLECTION 4: CULTURE & FUN (N3-N2)
    -- Entertainment, sports, cultural understanding
    -- ============================================

    INSERT INTO collections (name, description, emoji, level, order_index) VALUES
    ('Culture & Fun', 'Entertainment, sports, seasonal traditions, and Japanese culture', '🎎', 'N2', 4)
    RETURNING id INTO culture_fun_id;

    -- Lesson 4.1: Entertainment
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (culture_fun_id, 'Media & Entertainment', 'Anime, manga, TV, movies, and music', 1)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Anime%' OR domain LIKE '%TV%' OR domain LIKE '%Movies%' OR domain LIKE '%Music%')
    AND jlpt_level IN ('N3', 'N2')
    LIMIT 25;

    -- Lesson 4.2: Sports & Fitness
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (culture_fun_id, 'Active Life', 'Sports, gym, exercise, and staying healthy', 2)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE domain LIKE '%Sports%' AND jlpt_level IN ('N3', 'N2')
    LIMIT 25;

    -- Lesson 4.3: Seasonal Japan
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (culture_fun_id, 'Seasons & Traditions', 'Cherry blossoms, seasonal events, and Japanese traditions', 3)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Cherry Blossom%' OR domain LIKE '%Seasonal Traditions%' OR domain LIKE '%Snow%' OR domain LIKE '%Summer%')
    AND jlpt_level IN ('N3', 'N2')
    LIMIT 25;

    -- Lesson 4.4: Food Culture Deep Dive
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (culture_fun_id, 'Japanese Cuisine', 'Fine dining, izakaya culture, and food traditions', 4)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Fine Dining%' OR domain LIKE '%Izakaya%' OR domain LIKE '%Cafés%')
    AND jlpt_level IN ('N3', 'N2')
    LIMIT 20;

    -- Lesson 4.5: Regional Japan
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (culture_fun_id, 'Regions & Dialects', 'Regional differences, dialects, and local culture', 5)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE domain LIKE '%Regional%' AND jlpt_level IN ('N2', 'N1')
    LIMIT 20;

    -- ============================================
    -- COLLECTION 5: TRAVEL & ADVENTURE (N3-N2)
    -- Tourism, navigation, outdoor activities
    -- ============================================

    INSERT INTO collections (name, description, emoji, level, order_index) VALUES
    ('Travel & Adventure', 'Planning trips, navigating Japan, hotels, sightseeing, and outdoor activities', '🗾', 'N2', 5)
    RETURNING id INTO travel_id;

    -- Lesson 5.1: Trip Planning
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (travel_id, 'Planning Your Journey', 'Booking flights, hotels, and making travel arrangements', 1)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE domain LIKE '%Booking%' AND jlpt_level IN ('N3', 'N2')
    LIMIT 15;

    -- Lesson 5.2: Hotels & Accommodation
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (travel_id, 'Where to Stay', 'Hotels, ryokan, check-in, and accommodation vocabulary', 2)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Hotels%' OR domain LIKE '%Ryokan%') AND jlpt_level IN ('N3', 'N2')
    LIMIT 20;

    -- Lesson 5.3: Sightseeing
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (travel_id, 'Exploring Japan', 'Tourist spots, temples, shrines, and buying souvenirs', 3)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Sightseeing%' OR domain LIKE '%Souvenirs%') AND jlpt_level IN ('N3', 'N2')
    LIMIT 25;

    -- Lesson 5.4: Advanced Transportation
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (travel_id, 'Navigating Transit', 'Airports, long-distance trains, dealing with delays, getting lost', 4)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Airports%' OR domain LIKE '%Delays%' OR domain LIKE '%Lost%' OR domain LIKE '%Driving%')
    AND jlpt_level IN ('N3', 'N2')
    LIMIT 25;

    -- Lesson 5.5: Nature & Outdoors
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (travel_id, 'Outdoor Adventures', 'Hiking, camping, and enjoying Japanese nature', 5)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Hiking%' OR domain LIKE '%Camping%') AND jlpt_level IN ('N3', 'N2')
    LIMIT 20;

    -- ============================================
    -- COLLECTION 6: ADULT SYSTEMS (N2-N1)
    -- Bureaucracy, healthcare, advanced social nuance
    -- ============================================

    INSERT INTO collections (name, description, emoji, level, order_index) VALUES
    ('Adult Systems', 'Living in Japan: bureaucracy, healthcare, taxes, insurance, and deep cultural understanding', '📋', 'N1', 6)
    RETURNING id INTO adult_systems_id;

    -- Lesson 6.1: City Hall & Documents
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (adult_systems_id, 'Paperwork & Registration', 'City hall, residence cards, visas, and official documents', 1)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%City Hall%' OR domain LIKE '%Residence Cards%' OR domain LIKE '%Visa%')
    AND jlpt_level IN ('N2', 'N1')
    LIMIT 25;

    -- Lesson 6.2: Money Matters
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (adult_systems_id, 'Taxes & Finance', 'Taxes, banking, pensions, and financial systems', 2)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Taxes%' OR domain LIKE '%Banking%' OR domain LIKE '%Pension%' OR domain LIKE '%Saving%')
    AND jlpt_level IN ('N2', 'N1')
    LIMIT 25;

    -- Lesson 6.3: Healthcare System
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (adult_systems_id, 'Medical & Insurance', 'Doctors, hospitals, health insurance, and medical vocabulary', 3)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Health Insurance%' OR domain LIKE '%Hospital%' OR domain LIKE '%Doctor%')
    AND jlpt_level IN ('N2', 'N1')
    LIMIT 25;

    -- Lesson 6.4: Work Culture Mastery
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (adult_systems_id, 'Professional Japan', 'Advanced workplace culture, promotions, job hunting, and quitting', 4)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Deadlines%' OR domain LIKE '%Promotions%' OR domain LIKE '%Quitting%')
    AND jlpt_level IN ('N2', 'N1')
    LIMIT 25;

    -- Lesson 6.5: Social Nuance
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (adult_systems_id, 'Cultural Mastery', 'Tatemae/honne, honorifics, generational slang, and social subtleties', 5)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Tatemae%' OR domain LIKE '%Honorifics%' OR domain LIKE '%Slang%' OR domain LIKE '%Otaku%')
    AND jlpt_level IN ('N2', 'N1')
    LIMIT 25;

    -- Lesson 6.6: Daily Admin
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (adult_systems_id, 'Life Admin', 'Post office, driver''s license, marriage registration, and daily bureaucracy', 6)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Post Office%' OR domain LIKE '%Driver%' OR domain LIKE '%Marriage%')
    AND jlpt_level IN ('N2', 'N1')
    LIMIT 20;

    -- Lesson 6.7: Health & Wellness
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (adult_systems_id, 'Health & Body', 'Mental health, symptoms, pharmacy, and body-related vocabulary', 7)
    RETURNING id INTO lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Mental Health%' OR domain LIKE '%Symptoms%' OR domain LIKE '%Pharmacy%' OR domain LIKE '%Sleep%' OR domain LIKE '%Allergies%')
    AND jlpt_level IN ('N2', 'N1', 'N4', 'N3')
    LIMIT 25;

END $$;

-- Add any remaining unassigned sentences to appropriate lessons
-- This catches sentences that might have been missed in the initial assignment

DO $$
DECLARE
    misc_collection_id uuid;
    misc_lesson_id uuid;
BEGIN
    -- Create a "Mixed Practice" collection for any leftover sentences
    INSERT INTO collections (name, description, emoji, level, order_index) VALUES
    ('Mixed Practice', 'Additional practice sentences across various topics', '🎯', 'N3', 7)
    RETURNING id INTO misc_collection_id;

    -- Video Games
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (misc_collection_id, 'Gaming & Tech', 'Video games, smartphones, and technology', 1)
    RETURNING id INTO misc_lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT misc_lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Video Games%' OR domain LIKE '%Smartphones%' OR domain LIKE '%Tech%')
    AND id NOT IN (SELECT sentence_id FROM lesson_sentences)
    LIMIT 30;

    -- Shopping
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (misc_collection_id, 'Shopping & Commerce', 'Online shopping, department stores, and payments', 2)
    RETURNING id INTO misc_lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT misc_lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE (domain LIKE '%Shopping%' OR domain LIKE '%Department%' OR domain LIKE '%Paying%')
    AND id NOT IN (SELECT sentence_id FROM lesson_sentences)
    LIMIT 30;

    -- Catch-all for any remaining sentences
    INSERT INTO lessons (collection_id, name, description, order_index)
    VALUES (misc_collection_id, 'General Practice', 'Mixed topics for additional practice', 3)
    RETURNING id INTO misc_lesson_id;

    INSERT INTO lesson_sentences (lesson_id, sentence_id, order_index)
    SELECT misc_lesson_id, id, ROW_NUMBER() OVER (ORDER BY difficulty, created_at)
    FROM sentences
    WHERE id NOT IN (SELECT sentence_id FROM lesson_sentences)
    LIMIT 50;

END $$;

-- Display summary
SELECT
    c.name as collection,
    c.level,
    COUNT(DISTINCT l.id) as lesson_count,
    COUNT(ls.sentence_id) as total_sentences
FROM collections c
LEFT JOIN lessons l ON l.collection_id = c.id
LEFT JOIN lesson_sentences ls ON ls.lesson_id = l.id
GROUP BY c.id, c.name, c.level, c.order_index
ORDER BY c.order_index;
