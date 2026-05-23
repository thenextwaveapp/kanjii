/**
 * Fix furigana in words array using jpdb as source of truth
 */

const fs = require('fs');
const path = require('path');
const { loadJpdb } = require('./loadJpdb');

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

function fixFurigana() {
  console.log('Loading jpdb database...');
  const jpdb = loadJpdb();

  const csvPath = path.join(__dirname, '..', 'entire_sentences_filtered.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  // Keep header
  const output = [lines[0]];

  let totalFixed = 0;
  let totalNotFound = 0;
  let sentencesModified = 0;
  const notFoundWords = new Set();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

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

      const words = JSON.parse(wordsStr);
      let modified = false;

      for (const word of words) {
        if (!word.word) continue;

        const jpdbEntry = jpdb.get(word.word);

        if (jpdbEntry) {
          // Check if furigana needs fixing
          if (word.furigana !== jpdbEntry.reading) {
            word.furigana = jpdbEntry.reading;
            totalFixed++;
            modified = true;
          }
        } else {
          // Word not found in jpdb
          totalNotFound++;
          notFoundWords.add(word.word);
        }
      }

      if (modified) {
        sentencesModified++;

        // Rebuild the line with fixed words
        parts[3] = JSON.stringify(words);
        output.push(buildCSVLine(parts));
      } else {
        output.push(line);
      }

    } catch (e) {
      console.error(`Error processing line ${i}:`, e.message);
      output.push(line);
    }
  }

  // Write output
  const outputPath = path.join(__dirname, '..', 'entire_sentences_fixed_furigana.csv');
  fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');

  // Write report of words not found
  const reportPath = path.join(__dirname, '..', 'words-not-found-in-jpdb.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(Array.from(notFoundWords).sort(), null, 2),
    'utf-8'
  );

  console.log(`\n✓ Furigana fixing complete!`);
  console.log(`  - Fixed ${totalFixed} furigana entries in ${sentencesModified} sentences`);
  console.log(`  - ${totalNotFound} words not found in jpdb (see words-not-found-in-jpdb.json)`);
  console.log(`  - Output: entire_sentences_fixed_furigana.csv`);
}

if (require.main === module) {
  fixFurigana();
}

module.exports = { fixFurigana };
