/**
 * List all words with short meanings to see if they need fixing
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

function listShortMeanings() {
  const csvPath = path.join(__dirname, '..', 'entire_sentences_final.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const shortMeanings = new Map(); // meaning -> count

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
        const meaning = (word.meaning || '').trim();

        if (meaning && meaning.length < 3) {
          const key = `${word.word} = "${meaning}"`;
          shortMeanings.set(key, (shortMeanings.get(key) || 0) + 1);
        }
      }
    } catch (e) {
      // Skip
    }
  }

  const sorted = Array.from(shortMeanings.entries())
    .sort((a, b) => b[1] - a[1]);

  console.log('\n' + '='.repeat(70));
  console.log('WORDS WITH SHORT MEANINGS (< 3 characters)');
  console.log('='.repeat(70));
  console.log(`\nTotal unique: ${sorted.length}`);
  console.log(`\nWORD + MEANING`.padEnd(40) + 'COUNT'.padStart(10));
  console.log('-'.repeat(70));

  sorted.forEach(([key, count]) => {
    console.log(key.padEnd(40) + count.toString().padStart(10));
  });
}

if (require.main === module) {
  listShortMeanings();
}

module.exports = { listShortMeanings };
