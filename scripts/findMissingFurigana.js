const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    realtime: { transport: ws }
  }
);

// Regex to detect kanji characters
const KANJI_RE = /[\u4E00-\u9FFF\u3400-\u4DBF]/;

async function findMissingFurigana() {
  console.log('🔍 Finding sentences with missing furigana...\n');

  // Fetch all sentences with their word breakdowns
  const { data: sentences, error } = await supabase
    .from('sentences')
    .select('id, japanese, english, jlpt_level, domain, words')
    .order('id');

  if (error) {
    console.error('❌ Error fetching sentences:', error.message);
    return;
  }

  console.log(`📚 Checking ${sentences.length} sentences...\n`);

  const issues = [];

  sentences.forEach((sentence) => {
    if (!sentence.words || sentence.words.length === 0) {
      issues.push({
        id: sentence.id,
        japanese: sentence.japanese,
        english: sentence.english,
        jlpt_level: sentence.jlpt_level,
        domain: sentence.domain,
        issue: 'NO_WORDS_ARRAY',
        details: 'Missing words array entirely'
      });
      return;
    }

    // Check each word in the breakdown
    sentence.words.forEach((word, idx) => {
      // If the word contains kanji but has no furigana
      if (word.word && KANJI_RE.test(word.word)) {
        if (!word.furigana || word.furigana.trim() === '') {
          issues.push({
            id: sentence.id,
            japanese: sentence.japanese,
            english: sentence.english,
            jlpt_level: sentence.jlpt_level,
            domain: sentence.domain,
            issue: 'MISSING_FURIGANA',
            details: `Word "${word.word}" (index ${idx}) has kanji but no furigana`,
            word: word.word,
            wordIndex: idx
          });
        } else if (KANJI_RE.test(word.furigana)) {
          // Furigana field exists but still contains kanji
          issues.push({
            id: sentence.id,
            japanese: sentence.japanese,
            english: sentence.english,
            jlpt_level: sentence.jlpt_level,
            domain: sentence.domain,
            issue: 'KANJI_IN_FURIGANA',
            details: `Word "${word.word}" (index ${idx}) has kanji in furigana field: "${word.furigana}"`,
            word: word.word,
            furigana: word.furigana,
            wordIndex: idx
          });
        }
      }
    });
  });

  console.log(`\n📊 SUMMARY\n${'='.repeat(60)}`);
  console.log(`Total sentences checked: ${sentences.length}`);
  console.log(`Sentences with issues: ${new Set(issues.map(i => i.id)).size}`);
  console.log(`Total issues found: ${issues.length}\n`);

  // Group by issue type
  const byType = issues.reduce((acc, issue) => {
    acc[issue.issue] = (acc[issue.issue] || 0) + 1;
    return acc;
  }, {});

  console.log('Issues by type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log(`\n📝 DETAILED ISSUES\n${'='.repeat(60)}\n`);

  // Show first 50 issues
  const limit = 50;
  issues.slice(0, limit).forEach((issue, i) => {
    console.log(`${i + 1}. Sentence #${issue.id} (${issue.jlpt_level} - ${issue.domain})`);
    console.log(`   Japanese: ${issue.japanese}`);
    console.log(`   English: ${issue.english}`);
    console.log(`   Issue: ${issue.issue}`);
    console.log(`   Details: ${issue.details}`);
    console.log('');
  });

  if (issues.length > limit) {
    console.log(`... and ${issues.length - limit} more issues\n`);
  }

  // Export to JSON for further analysis
  const fs = require('fs');
  const outputFile = './missing-furigana-report.json';
  fs.writeFileSync(outputFile, JSON.stringify({
    summary: {
      totalSentences: sentences.length,
      sentencesWithIssues: new Set(issues.map(i => i.id)).size,
      totalIssues: issues.length,
      byType
    },
    issues
  }, null, 2));

  console.log(`\n✅ Full report saved to: ${outputFile}\n`);

  // Show sentences IDs that need fixing
  const sentenceIds = [...new Set(issues.map(i => i.id))];
  console.log(`\n📋 Sentence IDs with issues (${sentenceIds.length} total):`);
  console.log(sentenceIds.slice(0, 20).join(', '));
  if (sentenceIds.length > 20) {
    console.log(`... and ${sentenceIds.length - 20} more`);
  }
}

findMissingFurigana().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
