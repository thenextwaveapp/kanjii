#!/usr/bin/env node

/**
 * Validates that all kanji in sentences are covered by the words array
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Regex to match kanji characters
const kanjiRegex = /[\u4e00-\u9faf\u3400-\u4dbf]/g;

async function validateSentences() {
  console.log('🔍 Validating sentences...\n');

  const { data: sentences, error } = await supabase
    .from('sentences')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sentences:', error);
    return;
  }

  console.log(`Found ${sentences.length} sentences\n`);

  const incomplete = [];

  for (const sentence of sentences) {
    const { id, japanese, words } = sentence;

    // Extract all kanji from japanese text
    const kanjiInText = (japanese.match(kanjiRegex) || []);
    const uniqueKanji = [...new Set(kanjiInText)];

    // Get all kanji covered by words array
    const coveredKanji = new Set();
    (words || []).forEach(w => {
      const kanjiInWord = (w.word.match(kanjiRegex) || []);
      kanjiInWord.forEach(k => coveredKanji.add(k));
    });

    // Find missing kanji
    const missing = uniqueKanji.filter(k => !coveredKanji.has(k));

    if (missing.length > 0) {
      incomplete.push({
        id,
        japanese,
        domain: sentence.domain,
        jlpt_level: sentence.jlpt_level,
        missing,
      });
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`✅ Complete: ${sentences.length - incomplete.length}`);
  console.log(`❌ Incomplete: ${incomplete.length}\n`);

  if (incomplete.length > 0) {
    console.log('Incomplete sentences (showing first 20):\n');
    incomplete.slice(0, 20).forEach(s => {
      console.log(`ID: ${s.id}`);
      console.log(`Text: ${s.japanese}`);
      console.log(`Missing kanji: ${s.missing.join(', ')}`);
      console.log(`Domain: ${s.domain} | Level: ${s.jlpt_level}`);
      console.log('---');
    });

    console.log(`\n💡 To delete incomplete sentences:`);
    console.log(`DELETE FROM sentences WHERE id IN (${incomplete.map(s => s.id).join(', ')});`);
  }
}

validateSentences().catch(console.error);
