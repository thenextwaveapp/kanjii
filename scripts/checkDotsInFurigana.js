require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { toRomaji } = require('wanakana');
const ws = require('ws');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

async function checkDots() {
  console.log('🔍 Checking for dots/periods in furigana...\n');

  // First, check the specific word the user mentioned
  const { data: eatSentences } = await supabase
    .from('sentences')
    .select('id, japanese, english, words')
    .or('japanese.ilike.%食べる%,japanese.ilike.%たべる%')
    .limit(5);

  console.log('📝 Examples with 食べる/たべる:\n');
  eatSentences?.forEach(s => {
    console.log(`Sentence: ${s.japanese}`);
    console.log(`English: ${s.english}`);
    s.words?.forEach(w => {
      if (w.word.includes('食') || w.word.includes('たべ')) {
        console.log(`  Word: "${w.word}" → Furigana: "${w.furigana}"`);
        console.log(`  Romaji output: "${toRomaji(w.furigana)}"`);
        console.log(`  Has dot in furigana: ${w.furigana?.includes('.')}`);
        console.log(`  Has middot in furigana: ${w.furigana?.includes('・')}`);
      }
    });
    console.log('');
  });

  // Now check all sentences for dots in furigana
  const { data: allSentences } = await supabase
    .from('sentences')
    .select('id, japanese, words')
    .limit(2000);

  const withDots = [];

  allSentences?.forEach(s => {
    s.words?.forEach(w => {
      if (w.furigana && (w.furigana.includes('.') || w.furigana.includes('・'))) {
        withDots.push({
          sentence: s.japanese,
          word: w.word,
          furigana: w.furigana,
          romaji: toRomaji(w.furigana)
        });
      }
    });
  });

  console.log(`\n📊 Found ${withDots.length} words with dots in furigana:\n`);

  withDots.slice(0, 20).forEach(item => {
    console.log(`Sentence: ${item.sentence}`);
    console.log(`  Word: "${item.word}" → Furigana: "${item.furigana}" → Romaji: "${item.romaji}"`);
  });

  if (withDots.length > 20) {
    console.log(`\n... and ${withDots.length - 20} more`);
  }

  // Save report
  const fs = require('fs');
  fs.writeFileSync('./dots-in-furigana.json', JSON.stringify(withDots, null, 2));
  console.log(`\n✅ Full report saved to: ./dots-in-furigana.json`);
}

checkDots().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
