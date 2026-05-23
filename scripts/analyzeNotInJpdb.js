/**
 * Analyze words not found in jpdb
 * Categorize and identify which ones are actually problems
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

function hasKanji(text) {
  return /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text);
}

function isPlaceholder(text) {
  return /◯|○|×|〇/.test(text);
}

function isNumber(text) {
  return /^\d/.test(text) || /[0-9]/.test(text);
}

function analyzeNotInJpdb() {
  const csvPath = path.join(__dirname, '..', 'entire_sentences_cleaned.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const notInJpdbPath = path.join(__dirname, '..', 'words-not-in-jpdb.json');
  const notInJpdb = new Set(JSON.parse(fs.readFileSync(notInJpdbPath, 'utf-8')));

  const categories = {
    placeholders: [],
    numbersWithCounters: [],
    conjugatedVerbs: [],
    honorifics: [],
    compounds: [],
    missingFurigana: [],
    other: [],
  };

  const wordDetails = new Map(); // word -> { furigana, meaning, examples[] }

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
        if (!word.word || !notInJpdb.has(word.word)) continue;

        // Track details
        if (!wordDetails.has(word.word)) {
          wordDetails.set(word.word, {
            word: word.word,
            furigana: word.furigana,
            meaning: word.meaning,
            examples: [],
          });
        }
        wordDetails.get(word.word).examples.push(japanese);

        // Categorize
        if (isPlaceholder(word.word)) {
          if (!categories.placeholders.includes(word.word)) {
            categories.placeholders.push(word.word);
          }
        } else if (isNumber(word.word)) {
          if (!categories.numbersWithCounters.includes(word.word)) {
            categories.numbersWithCounters.push(word.word);
          }
        } else if (word.word.startsWith('お') && hasKanji(word.word.slice(1))) {
          if (!categories.honorifics.includes(word.word)) {
            categories.honorifics.push(word.word);
          }
        } else if (/ます|ました|ません|ください|いただ|おります/.test(word.word)) {
          if (!categories.conjugatedVerbs.includes(word.word)) {
            categories.conjugatedVerbs.push(word.word);
          }
        } else if (!word.furigana || word.furigana.trim() === '') {
          if (!categories.missingFurigana.includes(word.word)) {
            categories.missingFurigana.push(word.word);
          }
        } else if (hasKanji(word.word) && word.word.length > 2) {
          if (!categories.compounds.includes(word.word)) {
            categories.compounds.push(word.word);
          }
        } else {
          if (!categories.other.includes(word.word)) {
            categories.other.push(word.word);
          }
        }
      }
    } catch (e) {
      // Skip
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('WORDS NOT IN JPDB - CATEGORY BREAKDOWN');
  console.log('='.repeat(70));

  console.log(`\n1. PLACEHOLDERS (should be removed): ${categories.placeholders.length}`);
  console.log('   Examples:', categories.placeholders.slice(0, 10).join(', '));

  console.log(`\n2. NUMBERS + COUNTERS (OK, keep as-is): ${categories.numbersWithCounters.length}`);
  console.log('   Examples:', categories.numbersWithCounters.slice(0, 10).join(', '));

  console.log(`\n3. CONJUGATED VERBS (OK, keep as-is): ${categories.conjugatedVerbs.length}`);
  console.log('   Examples:', categories.conjugatedVerbs.slice(0, 10).join(', '));

  console.log(`\n4. HONORIFICS (OK, keep as-is): ${categories.honorifics.length}`);
  console.log('   Examples:', categories.honorifics.slice(0, 10).join(', '));

  console.log(`\n5. COMPOUNDS (OK, keep as-is): ${categories.compounds.length}`);
  console.log('   Examples:', categories.compounds.slice(0, 10).join(', '));

  console.log(`\n6. MISSING FURIGANA (PROBLEM!): ${categories.missingFurigana.length}`);
  if (categories.missingFurigana.length > 0) {
    console.log('   Examples:', categories.missingFurigana.slice(0, 10).join(', '));
  }

  console.log(`\n7. OTHER: ${categories.other.length}`);
  console.log('   Examples:', categories.other.slice(0, 10).join(', '));

  const totalIssues = categories.placeholders.length + categories.missingFurigana.length;
  const totalOK = notInJpdb.size - totalIssues;

  console.log('\n' + '='.repeat(70));
  console.log(`SUMMARY:`);
  console.log(`  Total words not in jpdb: ${notInJpdb.size}`);
  console.log(`  Actually OK (have furigana): ${totalOK} (${(totalOK / notInJpdb.size * 100).toFixed(1)}%)`);
  console.log(`  Real issues: ${totalIssues}`);
  console.log(`    - Placeholders to remove: ${categories.placeholders.length}`);
  console.log(`    - Missing furigana: ${categories.missingFurigana.length}`);
  console.log('='.repeat(70));

  // Write detailed report
  const reportPath = path.join(__dirname, '..', 'not-in-jpdb-categorized.json');
  fs.writeFileSync(reportPath, JSON.stringify(categories, null, 2), 'utf-8');

  // Write words with missing furigana for manual review
  const missingFuriganaDetails = categories.missingFurigana.map(w => wordDetails.get(w));
  const missingPath = path.join(__dirname, '..', 'words-missing-furigana.json');
  fs.writeFileSync(missingPath, JSON.stringify(missingFuriganaDetails, null, 2), 'utf-8');

  console.log('\nOutput files:');
  console.log('  - not-in-jpdb-categorized.json');
  console.log('  - words-missing-furigana.json');
}

if (require.main === module) {
  analyzeNotInJpdb();
}

module.exports = { analyzeNotInJpdb };
