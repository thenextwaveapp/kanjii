require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

async function verify() {
  console.log('🔍 Verifying dots were removed...\n');

  // Check the specific kanji 食 that user mentioned
  const { data: eatKanji } = await supabase
    .from('kanji_dictionary')
    .select('*')
    .eq('kanji', '食')
    .single();

  if (eatKanji) {
    console.log('📝 Kanji 食 (eat) current data:\n');
    console.log('Readings:', JSON.stringify(eatKanji.readings, null, 2));
    console.log('Readings Romaji:', JSON.stringify(eatKanji.readings_romaji, null, 2));
    console.log('Meanings:', JSON.stringify(eatKanji.meanings, null, 2));

    const hasDots = eatKanji.readings?.some(r => r.includes('.')) ||
                    eatKanji.readings_romaji?.some(r => r.includes('.'));

    if (hasDots) {
      console.log('\n⚠️  Still has dots!');
    } else {
      console.log('\n✅ No dots found');
    }
  }

  // Check if ANY kanji still has dots
  const { data: withDots } = await supabase
    .from('kanji_dictionary')
    .select('kanji, readings, readings_romaji')
    .limit(3000);

  const stillHaveDots = withDots?.filter(k => {
    return k.readings?.some(r => r.includes('.')) ||
           k.readings_romaji?.some(r => r.includes('.'));
  });

  console.log(`\n📊 Checked ${withDots?.length} kanji`);
  console.log(`⚠️  ${stillHaveDots?.length} still have dots`);

  if (stillHaveDots && stillHaveDots.length > 0) {
    console.log('\nExamples still with dots:');
    stillHaveDots.slice(0, 10).forEach(k => {
      console.log(`  ${k.kanji}: ${k.readings?.join(', ')}`);
    });
  }
}

verify().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
