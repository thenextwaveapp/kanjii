const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

// Your Supabase credentials
const SUPABASE_URL = 'https://wiptmmqwdhkuxaetrxdl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_owQOL6UnF9UQwvH0FXGwoA_-Dt8E1Vl';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: { 'x-custom-header': 'seed-script' },
  },
  realtime: {
    transport: ws
  }
});

async function seedKanjiDictionary() {
  console.log('🚀 Starting kanji dictionary import...\n');

  // Step 1: Test connection
  console.log('🔌 Testing Supabase connection...');
  const { data: testData, error: testError } = await supabase
    .from('kanji_dictionary')
    .select('count')
    .limit(1);

  if (testError) {
    console.error('❌ Connection failed:', testError.message);
    console.log('\n⚠️  Make sure you created the table first!');
    console.log('Run this SQL in Supabase SQL Editor:\n');
    console.log(fs.readFileSync('./supabase/create_kanji_dictionary_table.sql', 'utf8'));
    return;
  }

  console.log('✅ Connected to Supabase\n');

  // Step 2: Read kanji data from KANJIDIC2
  const dictionaryPath = '/Users/mayowarosanwo/Downloads/kanjidic2-parsed.json';
  const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));

  console.log(`📚 Found ${dictionary.length} kanji to import (KANJIDIC2)\n`);

  // Step 3: Insert in batches
  const batchSize = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < dictionary.length; i += batchSize) {
    const batch = dictionary.slice(i, i + batchSize);

    const records = batch.map(item => ({
      kanji: item.kanji,
      meanings: item.meanings || [item.meaning], // Store ALL meanings
      readings: item.readings || [],
      readings_romaji: item.readingsRomaji || [],
    }));

    const { error } = await supabase
      .from('kanji_dictionary')
      .upsert(records, { onConflict: 'kanji' });

    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      const progress = ((i + batch.length) / dictionary.length * 100).toFixed(1);
      process.stdout.write(`\r✅ Progress: ${progress}% (${inserted}/${dictionary.length})`);
    }
  }

  console.log('\n\n🎉 Import complete!');
  console.log(`✅ Successfully inserted: ${inserted} kanji`);
  if (errors > 0) {
    console.log(`❌ Errors: ${errors} kanji`);
  }
  console.log('\n✨ Your kanji dictionary is ready to use!');
}

seedKanjiDictionary().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
