/**
 * Final cleanup:
 * 1. Remove placeholder words (◯◯)
 * 2. Remove incomplete verb stems (single kanji with partial furigana)
 * 3. Flag remaining issues for manual review
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

function buildCSVLine(fields) {
  return fields.map(field => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return '"' + field.replace(/"/g, '""') + '"';
    }
    return field;
  }).join(',');
}

function isPlaceholder(word) {
  return /◯|○|×|〇/.test(word);
}

function hasKanji(text) {
  return /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text);
}

// Check if this is likely an incomplete verb stem
function isIncompleteVerbStem(word, furigana) {
  if (!word || !furigana) return false;
  if (!hasKanji(word)) return false;

  // Single kanji with 1-2 character furigana is likely incomplete
  if (word.length === 1 && furigana.length <= 2) {
    // Common verb stems
    const verbStems = ['読', '買', '売', '書', '送', '待', '帰', '困', '忘', '揉', '貰', '広'];
    return verbStems.includes(word);
  }

  return false;
}

function finalCleanup() {
  console.log('🔄 Starting final cleanup...\n');

  const csvPath = path.join(__dirname, '..', 'entire_sentences_cleaned.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const output = [lines[0]];

  const stats = {
    totalSentences: 0,
    placeholdersRemoved: 0,
    verbStemsRemoved: 0,
    sentencesModified: 0,
  };

  const removed = {
    placeholders: new Set(),
    verbStems: new Set(),
  };

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

      words = words.filter(w => {
        // Remove placeholders
        if (isPlaceholder(w.word)) {
          removed.placeholders.add(w.word);
          stats.placeholdersRemoved++;
          return false;
        }

        // Remove incomplete verb stems
        if (isIncompleteVerbStem(w.word, w.furigana)) {
          removed.verbStems.add(w.word);
          stats.verbStemsRemoved++;
          return false;
        }

        return true;
      });

      const removedCount = originalCount - words.length;

      if (removedCount > 0) {
        stats.sentencesModified++;
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
  const outputPath = path.join(__dirname, '..', 'entire_sentences_final.csv');
  fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');

  console.log('\n' + '='.repeat(60));
  console.log('✓ FINAL CLEANUP COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\nProcessed: ${stats.totalSentences} sentences`);
  console.log(`Modified: ${stats.sentencesModified} sentences`);
  console.log(`\nRemoved:`);
  console.log(`  - ${stats.placeholdersRemoved} placeholder words`);
  console.log(`  - ${stats.verbStemsRemoved} incomplete verb stems`);
  console.log(`\nPlaceholders removed:`, Array.from(removed.placeholders).join(', '));
  console.log(`Verb stems removed:`, Array.from(removed.verbStems).join(', '));
  console.log(`\nOutput: entire_sentences_final.csv`);
}

if (require.main === module) {
  finalCleanup();
}

module.exports = { finalCleanup };
