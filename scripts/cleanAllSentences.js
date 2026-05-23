/**
 * Complete cleanup pipeline:
 * 1. Filter out particles, punctuation, bad meanings
 * 2. Fix furigana using jpdb
 * 3. Generate before/after comparison
 */

const fs = require('fs');
const path = require('path');
const { loadJpdb } = require('./loadJpdb');
const { filterWords } = require('./filterBadWords');

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

function buildCSVLine(fields) {
  return fields.map(field => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return '"' + field.replace(/"/g, '""') + '"';
    }
    return field;
  }).join(',');
}

function cleanAll() {
  console.log('🔄 Starting complete cleanup pipeline...\n');

  console.log('Loading jpdb database...');
  const jpdb = loadJpdb();
  console.log('');

  const csvPath = path.join(__dirname, '..', 'entire_sentences.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  // Keep header
  const output = [lines[0]];

  const stats = {
    totalSentences: 0,
    wordsRemoved: 0,
    sentencesFiltered: 0,
    furiganaFixed: 0,
    sentencesWithFuriganaFixed: 0,
    wordsNotInJpdb: 0,
  };

  const notFoundWords = new Set();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    stats.totalSentences++;

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 4) {
        output.push(line);
        continue;
      }

      const wordsStr = parts[3];

      if (!wordsStr || wordsStr === '[]') {
        output.push(line);
        continue;
      }

      let words = JSON.parse(wordsStr);
      const originalCount = words.length;

      // Step 1: Filter bad words
      words = filterWords(words);
      const removedCount = originalCount - words.length;

      if (removedCount > 0) {
        stats.wordsRemoved += removedCount;
        stats.sentencesFiltered++;
      }

      // Step 2: Fix furigana with jpdb
      let furiganaModified = false;
      for (const word of words) {
        if (!word.word) continue;

        const jpdbEntry = jpdb.get(word.word);

        if (jpdbEntry) {
          if (word.furigana !== jpdbEntry.reading) {
            word.furigana = jpdbEntry.reading;
            stats.furiganaFixed++;
            furiganaModified = true;
          }
        } else {
          stats.wordsNotInJpdb++;
          notFoundWords.add(word.word);
        }
      }

      if (furiganaModified) {
        stats.sentencesWithFuriganaFixed++;
      }

      // Rebuild the line
      parts[3] = JSON.stringify(words);
      output.push(buildCSVLine(parts));

    } catch (e) {
      console.error(`Error processing line ${i}:`, e.message);
      output.push(line);
    }
  }

  // Write output
  const outputPath = path.join(__dirname, '..', 'entire_sentences_cleaned.csv');
  fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');

  // Write not found words
  const reportPath = path.join(__dirname, '..', 'words-not-in-jpdb.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(Array.from(notFoundWords).sort(), null, 2),
    'utf-8'
  );

  console.log('\n' + '='.repeat(60));
  console.log('✓ CLEANUP COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\nProcessed: ${stats.totalSentences} sentences`);
  console.log(`\nStep 1: Filter bad words`);
  console.log(`  - Removed ${stats.wordsRemoved} bad words`);
  console.log(`  - Modified ${stats.sentencesFiltered} sentences`);
  console.log(`\nStep 2: Fix furigana`);
  console.log(`  - Fixed ${stats.furiganaFixed} furigana entries`);
  console.log(`  - Modified ${stats.sentencesWithFuriganaFixed} sentences`);
  console.log(`  - ${stats.wordsNotInJpdb} words not found in jpdb (mostly numbers/counters)`);
  console.log(`\nOutput files:`);
  console.log(`  - entire_sentences_cleaned.csv`);
  console.log(`  - words-not-in-jpdb.json`);
}

if (require.main === module) {
  cleanAll();
}

module.exports = { cleanAll };
