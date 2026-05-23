require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const fs = require('fs');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

// Common grammatical terms that shouldn't be meanings
const GRAMMAR_TERMS = [
  'noun', 'verb', 'auxiliary verb', 'particle', 'adverb', 'adjective',
  'interjection', 'conjunction', 'pronoun', 'prefix', 'suffix',
  'pre-noun adjectival', 'adnominal adjective'
];

async function findBadMeanings() {
  console.log('🔍 Finding sentences with grammatical terms as meanings...\n');

  const { data: sentences } = await supabase
    .from('sentences')
    .select('id, japanese, english, words')
    .limit(2000);

  const badSentences = [];

  sentences?.forEach(s => {
    if (!s.words) return;

    const hasBadMeanings = s.words.some(w => {
      return w.meaning && GRAMMAR_TERMS.includes(w.meaning.toLowerCase());
    });

    if (hasBadMeanings) {
      badSentences.push({
        id: s.id,
        japanese: s.japanese,
        english: s.english,
        words: s.words
      });
    }
  });

  console.log(`📊 Found ${badSentences.length} sentences with bad meanings\n`);

  console.log('Examples:\n');
  badSentences.slice(0, 10).forEach((s, idx) => {
    console.log(`${idx + 1}. ${s.japanese}`);
    console.log(`   English: ${s.english}`);
    console.log('   Bad words:');
    s.words.forEach(w => {
      if (GRAMMAR_TERMS.includes(w.meaning?.toLowerCase())) {
        console.log(`     "${w.word}" (${w.furigana}) → "${w.meaning}" ❌`);
      }
    });
    console.log('');
  });

  // Save report
  fs.writeFileSync('./bad-meanings-report.json', JSON.stringify(badSentences, null, 2));
  console.log(`\n✅ Full report saved to: ./bad-meanings-report.json`);
  console.log(`\n💡 These ${badSentences.length} sentences need their meanings regenerated.`);
}

findBadMeanings().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
