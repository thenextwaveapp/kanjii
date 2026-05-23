/**
 * Check which words are missing meanings
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

const csvPath = path.join(__dirname, '..', 'entire_sentences_full_coverage.csv');
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n');

const missingMeanings = new Map(); // word -> count
let totalWords = 0;
let wordsWithMeaning = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;

  try {
    const parts = parseCSVLine(line);
    if (parts.length < 4) continue;

    const wordsStr = parts[3];
    if (!wordsStr || wordsStr === '[]') continue;

    const words = JSON.parse(wordsStr);

    words.forEach(w => {
      totalWords++;
      if (!w.meaning || w.meaning.trim() === '') {
        const count = missingMeanings.get(w.word) || 0;
        missingMeanings.set(w.word, count + 1);
      } else {
        wordsWithMeaning++;
      }
    });
  } catch (e) {
    // Skip
  }
}

// Sort by frequency
const sorted = Array.from(missingMeanings.entries())
  .sort((a, b) => b[1] - a[1]);

console.log('Words missing meanings (top 30 by frequency):\n');
sorted.slice(0, 30).forEach(([word, count], i) => {
  console.log(`  ${(i + 1).toString().padStart(2)}. ${word.padEnd(8)} (appears ${count} times)`);
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Total unique words missing meanings: ${missingMeanings.size}`);
console.log(`Total occurrences: ${totalWords - wordsWithMeaning}`);
console.log(`Words with meanings: ${wordsWithMeaning}/${totalWords} (${(wordsWithMeaning/totalWords*100).toFixed(1)}%)`);
console.log(`${'='.repeat(50)}`);
