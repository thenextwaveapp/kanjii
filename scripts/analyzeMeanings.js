/**
 * Analyze the quality of meanings in the cleaned data
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

function analyzeMeanings() {
  const csvPath = path.join(__dirname, '..', 'entire_sentences_final.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const stats = {
    totalWords: 0,
    emptyMeanings: 0,
    shortMeanings: 0, // < 3 chars
    genericMeanings: 0,
    goodMeanings: 0,
  };

  const meaningExamples = {
    empty: [],
    short: [],
    generic: [],
    good: [],
  };

  const genericTerms = new Set([
    'noun', 'verb', 'adjective', 'adverb', 'particle', 'auxiliary',
    'prefix', 'suffix', 'counter', 'pronoun', 'conjunction',
  ]);

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
          if (meaningExamples.empty.length < 10) {
            meaningExamples.empty.push(word.word);
          }
        } else if (meaning.length < 3) {
          stats.shortMeanings++;
          if (meaningExamples.short.length < 10) {
            meaningExamples.short.push(`${word.word} = "${meaning}"`);
          }
        } else if (genericTerms.has(meaning.toLowerCase())) {
          stats.genericMeanings++;
          if (meaningExamples.generic.length < 10) {
            meaningExamples.generic.push(`${word.word} = "${meaning}"`);
          }
        } else {
          stats.goodMeanings++;
          if (meaningExamples.good.length < 10) {
            meaningExamples.good.push(`${word.word} = "${meaning}"`);
          }
        }
      }
    } catch (e) {
      // Skip
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('MEANINGS QUALITY REPORT');
  console.log('='.repeat(70));

  console.log(`\nTotal words analyzed: ${stats.totalWords}`);
  console.log(`\nMEANING TYPE`.padEnd(35) + 'COUNT'.padStart(10) + '%'.padStart(10));
  console.log('-'.repeat(70));

  const types = [
    { label: 'Good meanings', count: stats.goodMeanings, examples: meaningExamples.good },
    { label: 'Empty meanings', count: stats.emptyMeanings, examples: meaningExamples.empty },
    { label: 'Too short (< 3 chars)', count: stats.shortMeanings, examples: meaningExamples.short },
    { label: 'Generic (noun/verb/etc)', count: stats.genericMeanings, examples: meaningExamples.generic },
  ];

  for (const type of types) {
    const pct = (type.count / stats.totalWords * 100).toFixed(1);
    console.log(
      type.label.padEnd(35) +
      type.count.toString().padStart(10) +
      `${pct}%`.padStart(10)
    );
    if (type.examples.length > 0) {
      console.log('  Examples:', type.examples.slice(0, 5).join(', '));
    }
  }

  const needsFix = stats.emptyMeanings + stats.shortMeanings + stats.genericMeanings;
  const qualityScore = (stats.goodMeanings / stats.totalWords * 100).toFixed(1);

  console.log('\n' + '='.repeat(70));
  console.log(`QUALITY SCORE: ${qualityScore}%`);
  console.log(`Words needing better meanings: ${needsFix} (${(needsFix / stats.totalWords * 100).toFixed(1)}%)`);
  console.log('='.repeat(70));
}

if (require.main === module) {
  analyzeMeanings();
}

module.exports = { analyzeMeanings };
