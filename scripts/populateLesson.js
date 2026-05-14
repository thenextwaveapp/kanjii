#!/usr/bin/env node

/**
 * Helper script to populate lessons with sentences
 *
 * Usage:
 *   node scripts/populateLesson.js --lesson "At the Airport" --sentences "id1,id2,id3"
 *   node scripts/populateLesson.js --lesson "At the Airport" --query "domain=Travel&level=N5&count=5"
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function populateLesson(lessonName, sentenceIds) {
  // Get lesson ID
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, name')
    .eq('name', lessonName)
    .single();

  if (lessonError || !lesson) {
    console.error(`❌ Lesson "${lessonName}" not found`);
    return;
  }

  console.log(`📝 Populating lesson: ${lesson.name}`);

  // Insert sentences in order
  for (let i = 0; i < sentenceIds.length; i++) {
    const { error } = await supabase
      .from('lesson_sentences')
      .insert({
        lesson_id: lesson.id,
        sentence_id: sentenceIds[i],
        order_index: i + 1,
      });

    if (error) {
      console.error(`  ✗ Failed to add sentence ${sentenceIds[i]}:`, error.message);
    } else {
      console.log(`  ✓ Added sentence ${i + 1}/${sentenceIds.length}`);
    }
  }

  // Update total_count for any existing progress records
  await supabase
    .from('user_lesson_progress')
    .update({ total_count: sentenceIds.length })
    .eq('lesson_id', lesson.id);

  console.log(`✅ Lesson populated with ${sentenceIds.length} sentences`);
}

async function findAndPopulate(lessonName, query) {
  const { domain, level, count = 5 } = query;

  console.log(`🔍 Finding sentences: domain=${domain}, level=${level}, count=${count}`);

  let dbQuery = supabase
    .from('sentences')
    .select('id, japanese, domain, jlpt_level')
    .limit(parseInt(count));

  if (domain && domain !== 'Any') {
    dbQuery = dbQuery.or(`domain.eq.${domain},domain.like.${domain}:%`);
  }
  if (level && level !== 'Mixed') {
    dbQuery = dbQuery.eq('jlpt_level', level);
  }

  const { data: sentences, error } = await dbQuery;

  if (error || !sentences || sentences.length === 0) {
    console.error('❌ No sentences found matching criteria');
    return;
  }

  console.log(`Found ${sentences.length} sentences:`);
  sentences.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.japanese} (${s.jlpt_level} - ${s.domain})`);
  });

  const sentenceIds = sentences.map(s => s.id);
  await populateLesson(lessonName, sentenceIds);
}

async function main() {
  const args = process.argv.slice(2);
  let lessonName = null;
  let sentenceIds = [];
  let query = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lesson' && args[i + 1]) {
      lessonName = args[i + 1];
      i++;
    } else if (args[i] === '--sentences' && args[i + 1]) {
      sentenceIds = args[i + 1].split(',');
      i++;
    } else if (args[i] === '--query' && args[i + 1]) {
      // Parse query string: "domain=Travel&level=N5&count=5"
      args[i + 1].split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        query[key] = value;
      });
      i++;
    }
  }

  if (!lessonName) {
    console.error('❌ Usage: node scripts/populateLesson.js --lesson "Lesson Name" --sentences "id1,id2,id3"');
    console.error('   Or: node scripts/populateLesson.js --lesson "Lesson Name" --query "domain=Travel&level=N5&count=5"');
    process.exit(1);
  }

  if (sentenceIds.length > 0) {
    await populateLesson(lessonName, sentenceIds);
  } else if (Object.keys(query).length > 0) {
    await findAndPopulate(lessonName, query);
  } else {
    console.error('❌ Must provide either --sentences or --query');
    process.exit(1);
  }
}

main().catch(console.error);
