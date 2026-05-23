/**
 * Check what language ALL meanings are in across the entire dataset
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

function checkAllMeanings() {
  console.log('🔍 Checking language of ALL meanings in dataset...\n');

  const csvPath = path.join(__dirname, '..', 'entire_sentences_final.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const stats = {
    totalWords: 0,
    englishMeanings: 0,
    japaneseMeanings: 0,
    emptyMeanings: 0,
  };

  const japaneseMeaningExamples = [];
  const emptyMeaningExamples = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 4) continue;

      const wordsStr = parts[3];
      if (!wordsStr || wordsStr === '[]') continue;

      const words = JSON.parse(wordsStr);

      for (const word of words) {
        if (!word.word) continue;

        stats.totalWords++;
        const meaning = (word.meaning || '').trim();

        if (!meaning) {
          stats.emptyMeanings++;
          if (emptyMeaningExamples.length < 20) {
            emptyMeaningExamples.push(word.word);
          }
        } else if (hasJapanese(meaning)) {
          stats.japaneseMeanings++;
          if (japaneseMeaningExamples.length < 50) {
            japaneseMeaningExamples.push({
              word: word.word,
              meaning: meaning,
              furigana: word.furigana,
            });
          }
        } else {
          stats.englishMeanings++;
        }
      }
    } catch (e) {
      // Skip
    }
  }

  console.log('='.repeat(70));
  console.log('MEANING LANGUAGE ANALYSIS - ENTIRE DATASET');
  console.log('='.repeat(70));

  console.log(`\nTotal words: ${stats.totalWords}`);
  console.log(`\n${'LANGUAGE'.padEnd(30)}${'COUNT'.padStart(10)}${'%'.padStart(10)}`);
  console.log('-'.repeat(70));

  const englishPct = (stats.englishMeanings / stats.totalWords * 100).toFixed(1);
  const japanesePct = (stats.japaneseMeanings / stats.totalWords * 100).toFixed(1);
  const emptyPct = (stats.emptyMeanings / stats.totalWords * 100).toFixed(1);

  console.log(`${'English'.padEnd(30)}${stats.englishMeanings.toString().padStart(10)}${(englishPct + '%').padStart(10)}`);
  console.log(`${'Japanese (NEED TRANSLATION!)'.padEnd(30)}${stats.japaneseMeanings.toString().padStart(10)}${(japanesePct + '%').padStart(10)}`);
  console.log(`${'Empty (NEED MEANING!)'.padEnd(30)}${stats.emptyMeanings.toString().padStart(10)}${(emptyPct + '%').padStart(10)}`);

  console.log('\n' + '='.repeat(70));
  console.log(`WORDS NEEDING ENGLISH MEANINGS: ${stats.japaneseMeanings + stats.emptyMeanings} (${((stats.japaneseMeanings + stats.emptyMeanings) / stats.totalWords * 100).toFixed(1)}%)`);
  console.log('='.repeat(70));

  if (japaneseMeaningExamples.length > 0) {
    console.log(`\n🇯🇵 JAPANESE MEANINGS (sample):`);
    japaneseMeaningExamples.slice(0, 20).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.word} = "${item.meaning}"`);
    });
  }

  if (emptyMeaningExamples.length > 0) {
    console.log(`\n❌ EMPTY MEANINGS (sample):`);
    console.log(`  ${emptyMeaningExamples.slice(0, 20).join(', ')}`);
  }

  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'japanese-meanings-to-fix.json');
  fs.writeFileSync(reportPath, JSON.stringify(japaneseMeaningExamples, null, 2), 'utf-8');

  console.log(`\n📝 Detailed report saved to: japanese-meanings-to-fix.json`);
}

if (require.main === module) {
  checkAllMeanings();
}

module.exports = { checkAllMeanings };
