/**
 * Verify that all words have proper meanings
 */

const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function hasJapanese(text) {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

function verifyComplete() {
  console.log('🔍 Verifying all words have meanings...\n');

  const csvPath = path.join(__dirname, '..', 'entire_sentences_complete.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const stats = {
    totalWords: 0,
    withMeaning: 0,
    emptyMeaning: 0,
    japaneseMeaning: 0,
    goodMeaning: 0,
  };

  const issues = {
    empty: [],
    japanese: [],
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 4) continue;

      const japanese = parts[1];
      const wordsStr = parts[3];

      if (!wordsStr || wordsStr === '[]') continue;

      const words = JSON.parse(wordsStr);

      for (const word of words) {
        if (!word.word) continue;

        stats.totalWords++;
        const meaning = (word.meaning || '').trim();

        if (!meaning) {
          stats.emptyMeaning++;
          if (issues.empty.length < 20) {
            issues.empty.push({
              word: word.word,
              furigana: word.furigana,
              sentence: japanese,
            });
          }
        } else if (hasJapanese(meaning)) {
          stats.japaneseMeaning++;
          if (issues.japanese.length < 20) {
            issues.japanese.push({
              word: word.word,
              meaning: meaning,
              sentence: japanese,
            });
          }
        } else {
          stats.goodMeaning++;
          stats.withMeaning++;
        }
      }

    } catch (e) {
      console.error(`Error processing line ${i}:`, e.message);
    }
  }

  // Calculate percentages
  const goodPct = (stats.goodMeaning / stats.totalWords * 100).toFixed(1);
  const emptyPct = (stats.emptyMeaning / stats.totalWords * 100).toFixed(1);
  const japanesePct = (stats.japaneseMeaning / stats.totalWords * 100).toFixed(1);

  console.log('='.repeat(70));
  console.log('MEANING VERIFICATION REPORT');
  console.log('='.repeat(70));
  console.log(`\nTotal words: ${stats.totalWords}`);
  console.log();
  console.log(`${'METRIC'.padEnd(40)}${'COUNT'.padStart(10)}${'%'.padStart(10)}`);
  console.log('-'.repeat(70));
  console.log(`${'Words with good English meanings'.padEnd(40)}${stats.goodMeaning.toString().padStart(10)}${(goodPct + '%').padStart(10)}`);
  console.log(`${'Words with empty meanings'.padEnd(40)}${stats.emptyMeaning.toString().padStart(10)}${(emptyPct + '%').padStart(10)}`);
  console.log(`${'Words with Japanese meanings'.padEnd(40)}${stats.japaneseMeaning.toString().padStart(10)}${(japanesePct + '%').padStart(10)}`);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`QUALITY SCORE: ${goodPct}%`);
  console.log(`${'='.repeat(70)}`);

  // Show issues
  if (issues.empty.length > 0) {
    console.log('\n⚠️  Sample words with EMPTY meanings:');
    issues.empty.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.word} (${item.furigana || 'no furigana'})`);
      console.log(`     Sentence: ${item.sentence}`);
    });
  }

  if (issues.japanese.length > 0) {
    console.log('\n⚠️  Sample words with JAPANESE meanings:');
    issues.japanese.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.word} → "${item.meaning}"`);
      console.log(`     Sentence: ${item.sentence}`);
    });
  }

  if (stats.emptyMeaning === 0 && stats.japaneseMeaning === 0) {
    console.log('\n✨ Perfect! All words have English meanings.');
    console.log('Ready to update database!');
  } else {
    console.log(`\n⚠️  ${stats.emptyMeaning + stats.japaneseMeaning} words still need meanings.`);
  }

  console.log();
}

if (require.main === module) {
  verifyComplete();
}

module.exports = { verifyComplete };
