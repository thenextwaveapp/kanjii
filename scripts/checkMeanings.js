require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

async function checkMeanings() {
  console.log('🔍 Checking word meanings...\n');

  const { data: sentences } = await supabase
    .from('sentences')
    .select('id, japanese, english, words')
    .limit(10);

  console.log('Sample sentences and their word meanings:\n');

  sentences?.forEach((s, idx) => {
    console.log(`${idx + 1}. ${s.japanese}`);
    console.log(`   English: ${s.english}`);
    console.log('   Words:');
    s.words?.forEach(w => {
      console.log(`     "${w.word}" → furigana: "${w.furigana}", meaning: "${w.meaning}"`);
    });
    console.log('');
  });
}

checkMeanings().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
