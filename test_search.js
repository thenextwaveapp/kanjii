require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { toHiragana } = require('wanakana');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
  realtime: {
    disabled: true,
  },
});

async function testSearch() {
  const searchQuery = 'kuruma';
  const query = searchQuery.toLowerCase();
  const hiraganaQuery = toHiragana(query);

  console.log('='.repeat(60));
  console.log('TESTING SEARCH FOR: "kuruma"');
  console.log('='.repeat(60));
  console.log(`Original query: "${query}"`);
  console.log(`Hiragana query: "${hiraganaQuery}"`);
  console.log('');

  // 1. Search in kanji character directly
  console.log('1. Searching in kanji column...');
  const { data: kanjiMatches, error: e1 } = await supabase
    .from('kanji_dictionary')
    .select('kanji, meanings, readings')
    .ilike('kanji', `%${query}%`)
    .limit(50);
  
  if (e1) console.error('Error:', e1.message);
  console.log(`   Found ${kanjiMatches?.length || 0} matches`);
  if (kanjiMatches?.length) console.log('   Results:', kanjiMatches.slice(0, 2));
  console.log('');

  // 2. Search in meanings array
  console.log('2. Searching in meanings...');
  const { data: meaningMatches, error: e2 } = await supabase
    .rpc('search_kanji_meanings', { search_query: query })
    .limit(50);
  
  if (e2) console.error('Error:', e2.message);
  console.log(`   Found ${meaningMatches?.length || 0} matches`);
  if (meaningMatches?.length) console.log('   Results:', meaningMatches.slice(0, 2));
  console.log('');

  // 3. Search in readings with original query
  console.log('3. Searching in readings (original "kuruma")...');
  const { data: readingMatches1, error: e3 } = await supabase
    .rpc('search_kanji_readings', { search_query: query })
    .limit(50);
  
  if (e3) console.error('Error:', e3.message);
  console.log(`   Found ${readingMatches1?.length || 0} matches`);
  if (readingMatches1?.length) {
    console.log('   Results:', readingMatches1.slice(0, 2));
  }
  console.log('');

  // 4. Search in readings with hiragana
  console.log(`4. Searching in readings (hiragana "${hiraganaQuery}")...`);
  const { data: readingMatches2, error: e4 } = await supabase
    .rpc('search_kanji_readings', { search_query: hiraganaQuery })
    .limit(50);
  
  if (e4) console.error('Error:', e4.message);
  console.log(`   Found ${readingMatches2?.length || 0} matches`);
  if (readingMatches2?.length) {
    console.log('   Results:', readingMatches2.slice(0, 2));
  }
  console.log('');

  // Combine results
  const seen = new Set();
  const allResults = [];
  
  [...(kanjiMatches || []), ...(meaningMatches || []), ...(readingMatches1 || []), ...(readingMatches2 || [])].forEach(k => {
    if (!seen.has(k.kanji)) {
      seen.add(k.kanji);
      allResults.push(k);
    }
  });

  console.log('='.repeat(60));
  console.log(`FINAL RESULTS: ${allResults.length} unique kanji found`);
  console.log('='.repeat(60));
  
  allResults.forEach((k, idx) => {
    console.log(`\n${idx + 1}. ${k.kanji}`);
    console.log(`   Meanings: ${(k.meanings || []).join(', ')}`);
    console.log(`   Readings: ${(k.readings || []).join(', ')}`);
  });
}

testSearch().catch(console.error);
