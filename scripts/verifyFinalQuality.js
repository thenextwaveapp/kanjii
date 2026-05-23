/**
 * Verify final data quality across all dimensions
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

function isBadMeaning(meaning) {
  if (!meaning || meaning.trim() === '') return true;

  const badMeanings = new Set([
    'noun', 'verb', 'adjective', 'adverb', 'particle',
    'auxiliary', 'prefix', 'suffix', 'counter', 'interjection',
    '名詞', '動詞', '形容詞', '副詞', '助詞'
  ]);

  return badMeanings.has(meaning.toLowerCase().trim());
}

function verifyQuality() {
  console.log('🔍 Verifying final data quality...\n');

  const csvPath = path.join(__dirname, '..', 'entire_sentences_final.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const stats = {
    totalSentences: 0,
    totalWords: 0,
    goodWords: 0,
    wordsWithFurigana: 0,
    wordsWithJapaneseMeaning: 0,
    wordsWithBadMeaning: 0,
    wordsWithEmptyMeaning: 0,
  };

  const issues = {
    japaneseMeanings: [],
    badMeanings: [],
    emptyMeanings: [],
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 4) continue;

      stats.totalSentences++;
      const japanese = parts[1];
      const wordsStr = parts[3];

      if (!wordsStr || wordsStr === '[]') continue;

      const words = JSON.parse(wordsStr);

      for (const word of words) {
        if (!word.word) continue;

        stats.totalWords++;

        // Check furigana
        if (word.furigana && word.furigana.trim()) {
          stats.wordsWithFurigana++;
        }

        const meaning = (word.meaning || '').trim();

        // Check for Japanese meanings
        if (hasJapanese(meaning)) {
          stats.wordsWithJapaneseMeaning++;
          if (issues.japaneseMeanings.length < 10) {
            issues.japaneseMeanings.push({
              word: word.word,
              meaning: meaning,
              sentence: japanese,
            });
          }
        }
        // Check for bad meanings
        else if (isBadMeaning(meaning)) {
          stats.wordsWithBadMeaning++;
          if (issues.badMeanings.length < 10) {
            issues.badMeanings.push({
              word: word.word,
              meaning: meaning,
              sentence: japanese,
            });
          }
        }
        // Check for empty meanings
        else if (meaning === '') {
          stats.wordsWithEmptyMeaning++;
          if (issues.emptyMeanings.length < 10) {
            issues.emptyMeanings.push({
              word: word.word,
              sentence: japanese,
            });
          }
        }
        // Good word
        else {
          stats.goodWords++;
        }
      }

    } catch (e) {
      console.error(`Error processing line ${i}:`, e.message);
    }
  }

  // Calculate percentages
  const goodPct = (stats.goodWords / stats.totalWords * 100).toFixed(1);
  const furiganaPct = (stats.wordsWithFurigana / stats.totalWords * 100).toFixed(1);
  const japanesePct = (stats.wordsWithJapaneseMeaning / stats.totalWords * 100).toFixed(1);
  const badPct = (stats.wordsWithBadMeaning / stats.totalWords * 100).toFixed(1);
  const emptyPct = (stats.wordsWithEmptyMeaning / stats.totalWords * 100).toFixed(1);

  console.log('='.repeat(70));
  console.log('FINAL DATA QUALITY REPORT');
  console.log('='.repeat(70));
  console.log(`\nTotal sentences: ${stats.totalSentences}`);
  console.log(`Total words: ${stats.totalWords}`);
  console.log();
  console.log(`${'METRIC'.padEnd(40)}${'COUNT'.padStart(10)}${'%'.padStart(10)}`);
  console.log('-'.repeat(70));
  console.log(`${'Good words (valid English meanings)'.padEnd(40)}${stats.goodWords.toString().padStart(10)}${(goodPct + '%').padStart(10)}`);
  console.log(`${'Words with furigana'.padEnd(40)}${stats.wordsWithFurigana.toString().padStart(10)}${(furiganaPct + '%').padStart(10)}`);
  console.log();
  console.log('ISSUES:');
  console.log(`${'Words with Japanese meanings'.padEnd(40)}${stats.wordsWithJapaneseMeaning.toString().padStart(10)}${(japanesePct + '%').padStart(10)}`);
  console.log(`${'Words with bad/generic meanings'.padEnd(40)}${stats.wordsWithBadMeaning.toString().padStart(10)}${(badPct + '%').padStart(10)}`);
  console.log(`${'Words with empty meanings'.padEnd(40)}${stats.wordsWithEmptyMeaning.toString().padStart(10)}${(emptyPct + '%').padStart(10)}`);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`OVERALL QUALITY SCORE: ${goodPct}%`);
  console.log(`${'='.repeat(70)}`);

  // Show sample issues if any
  if (issues.japaneseMeanings.length > 0) {
    console.log('\n⚠️  Sample Japanese meanings still present:');
    issues.japaneseMeanings.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.word} → "${item.meaning}"`);
      console.log(`     Sentence: ${item.sentence}`);
    });
  }

  if (issues.badMeanings.length > 0) {
    console.log('\n⚠️  Sample bad/generic meanings:');
    issues.badMeanings.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.word} → "${item.meaning}"`);
      console.log(`     Sentence: ${item.sentence}`);
    });
  }

  if (issues.emptyMeanings.length > 0) {
    console.log('\n⚠️  Sample empty meanings:');
    issues.emptyMeanings.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.word} (no meaning)`);
      console.log(`     Sentence: ${item.sentence}`);
    });
  }

  if (stats.wordsWithJapaneseMeaning === 0 && stats.wordsWithBadMeaning === 0 && stats.wordsWithEmptyMeaning === 0) {
    console.log('\n✨ No issues found! Data is production-ready.');
  }

  console.log();
}

if (require.main === module) {
  verifyQuality();
}

module.exports = { verifyQuality };
