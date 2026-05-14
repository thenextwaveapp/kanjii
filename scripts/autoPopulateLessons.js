#!/usr/bin/env node

/**
 * Auto-populate all empty lessons with matching sentences from database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Map lesson names to domain patterns and levels
const LESSON_MAPPING = {
  // Basic Travel collection
  'At the Airport': { domain: 'Travel', level: 'N5', count: 5 },
  'Taking the Train': { domain: 'Transportation', level: 'N5', count: 5 },
  'Hotel Check-in': { domain: 'Travel', level: 'N5', count: 5 },

  // Restaurant Survival collection
  'Ordering Basics': { domain: 'Food & drink', level: 'N5', count: 5 },
  'Menu Navigation': { domain: 'Food & drink', level: 'N5', count: 5 },
  'Paying the Bill': { domain: 'Shopping & Money', level: 'N5', count: 5 },

  // Making Friends collection
  'Introductions': { domain: 'Work', level: 'N4', count: 5 },
  'Small Talk': { domain: 'Work', level: 'N4', count: 5 },
  'Making Plans': { domain: 'Relationships', level: 'N4', count: 5 },
};

async function findSentences(domainPattern, level, count) {
  let query = supabase
    .from('sentences')
    .select('id, japanese, domain, jlpt_level')
    .limit(count);

  if (domainPattern && domainPattern !== 'Any') {
    query = query.or(`domain.eq.${domainPattern},domain.like.${domainPattern}:%`);
  }
  if (level && level !== 'Mixed') {
    query = query.eq('jlpt_level', level);
  }

  const { data } = await query;
  return data || [];
}

async function populateLesson(lessonName, sentenceIds) {
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id')
    .eq('name', lessonName)
    .single();

  if (!lesson) {
    console.log(`  ❌ Lesson "${lessonName}" not found`);
    return false;
  }

  // Check if already populated
  const { count: existing } = await supabase
    .from('lesson_sentences')
    .select('*', { count: 'exact', head: true })
    .eq('lesson_id', lesson.id);

  if (existing > 0) {
    console.log(`  ⏭  Already has ${existing} sentences, skipping`);
    return true;
  }

  // Insert sentences
  for (let i = 0; i < sentenceIds.length; i++) {
    await supabase
      .from('lesson_sentences')
      .insert({
        lesson_id: lesson.id,
        sentence_id: sentenceIds[i],
        order_index: i + 1,
      });
  }

  console.log(`  ✓ Added ${sentenceIds.length} sentences`);
  return true;
}

async function main() {
  console.log('🚀 Auto-populating lessons...\n');

  for (const [lessonName, config] of Object.entries(LESSON_MAPPING)) {
    console.log(`📝 ${lessonName}`);
    console.log(`   Looking for: ${config.domain} (${config.level})`);

    const sentences = await findSentences(config.domain, config.level, config.count);

    if (sentences.length === 0) {
      console.log(`   ⚠️  No sentences found, trying without level filter...`);
      const fallbackSentences = await findSentences(config.domain, null, config.count);

      if (fallbackSentences.length === 0) {
        console.log(`   ❌ Still no sentences found, skipping\n`);
        continue;
      } else {
        console.log(`   Found ${fallbackSentences.length} sentences (mixed levels)`);
        const ids = fallbackSentences.map(s => s.id);
        await populateLesson(lessonName, ids);
      }
    } else {
      console.log(`   Found ${sentences.length} sentences`);
      const ids = sentences.map(s => s.id);
      await populateLesson(lessonName, ids);
    }

    console.log('');
  }

  console.log('✅ Done!');
  console.log('\nRun: node scripts/listCollections.js to see results');
}

main().catch(console.error);
