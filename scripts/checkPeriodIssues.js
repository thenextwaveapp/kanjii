require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

async function checkPeriodIssues() {
  console.log('🔍 Checking for period issues in furigana...\n');

  const { data: sentences, error } = await supabase
    .from('sentences')
    .select('id, japanese, words')
    .limit(1000);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const issues = [];

  sentences.forEach(s => {
    if (!s.words) return;

    s.words.forEach((w, idx) => {
      // Check for periods in furigana
      if (w.furigana && w.furigana.includes('。')) {
        issues.push({
          type: 'PERIOD_IN_FURIGANA',
          sentence: s.japanese,
          word: w.word,
          furigana: w.furigana,
          index: idx
        });
      }

      // Check for punctuation as words
      if (w.word && /^[。、！？.,!?]+$/.test(w.word)) {
        issues.push({
          type: 'PUNCTUATION_AS_WORD',
          sentence: s.japanese,
          word: w.word,
          furigana: w.furigana,
          index: idx
        });
      }

      // Check for other periods/dots
      if (w.furigana && /[\.・]/.test(w.furigana)) {
        issues.push({
          type: 'DOT_IN_FURIGANA',
          sentence: s.japanese,
          word: w.word,
          furigana: w.furigana,
          index: idx
        });
      }
    });
  });

  console.log(`Found ${issues.length} issues:\n`);

  // Group by type
  const byType = issues.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {});

  console.log('By type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\nExamples:\n');

  // Show examples of each type
  Object.keys(byType).forEach(type => {
    const examples = issues.filter(i => i.type === type).slice(0, 5);
    console.log(`\n${type}:`);
    examples.forEach(ex => {
      console.log(`  "${ex.sentence}"`);
      console.log(`    Word: "${ex.word}" → Furigana: "${ex.furigana}"`);
    });
  });

  // Save full report
  const fs = require('fs');
  fs.writeFileSync('./period-issues-report.json', JSON.stringify(issues, null, 2));
  console.log(`\n✅ Full report saved to: ./period-issues-report.json`);
}

checkPeriodIssues().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
