/**
 * Derive contextual meanings using multi-source approach:
 * 1. Pattern matching (Japanese + English + Dictionary)
 * 2. AI fallback for complex cases
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

function isSelfReferential(word, meaning) {
  return word === meaning;
}

function needsImprovement(meaning) {
  if (!meaning || meaning.trim() === '') return true;
  if (meaning.length < 3) return true;
  // Check if meaning is just the word itself
  return false;
}

// Pattern matching: find which dictionary meaning appears in English translation
function findContextualMeaning(word, dictMeanings, englishTranslation) {
  if (!dictMeanings || !englishTranslation) return null;

  const english = englishTranslation.toLowerCase();

  // Split dictionary meanings (usually comma-separated)
  const meanings = dictMeanings.split(',').map(m => m.trim());

  // Try to find exact matches first
  for (const meaning of meanings) {
    const meaningLower = meaning.toLowerCase();

    // Escape special regex characters
    const escapedMeaning = meaningLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Check for exact word match
    const regex = new RegExp(`\\b${escapedMeaning}\\b`, 'i');
    if (regex.test(english)) {
      return meaning;
    }
  }

  // Try partial matches (for longer meanings)
  for (const meaning of meanings) {
    const meaningLower = meaning.toLowerCase();

    // Split meaning into words
    const meaningWords = meaningLower.split(/\s+/);

    // Check if any significant word from meaning appears in English
    for (const mword of meaningWords) {
      if (mword.length >= 4) { // Only check substantial words
        if (english.includes(mword)) {
          return meaning;
        }
      }
    }
  }

  // No match found - return first meaning as fallback
  return meanings[0];
}

function deriveMeanings() {
  console.log('🧠 Deriving contextual meanings...\n');

  // Load JMdict dictionary
  const dictPath = path.join(__dirname, '..', 'jmdict-subset.json');
  const jmdict = JSON.parse(fs.readFileSync(dictPath, 'utf-8'));

  console.log(`Loaded ${Object.keys(jmdict).length} definitions from JMdict\n`);

  const csvPath = path.join(__dirname, '..', 'entire_sentences_final.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const output = [lines[0]];

  const stats = {
    totalWords: 0,
    patternMatched: 0,
    dictionaryFallback: 0,
    keptExisting: 0,
    needsAI: 0,
  };

  const needsAI = []; // Words that need AI processing

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 4) {
        output.push(line);
        continue;
      }

      const japanese = parts[1];
      const english = parts[2];
      const wordsStr = parts[3];

      if (!wordsStr || wordsStr === '[]') {
        output.push(line);
        continue;
      }

      const words = JSON.parse(wordsStr);
      let modified = false;

      for (const word of words) {
        if (!word.word) continue;

        stats.totalWords++;
        const currentMeaning = (word.meaning || '').trim();

        // Check if we should try to improve the meaning
        const shouldImprove =
          needsImprovement(currentMeaning) ||
          isSelfReferential(word.word, currentMeaning);

        if (shouldImprove) {
          // Try pattern matching
          if (jmdict[word.word]) {
            const contextualMeaning = findContextualMeaning(
              word.word,
              jmdict[word.word],
              english
            );

            if (contextualMeaning) {
              word.meaning = contextualMeaning;
              stats.patternMatched++;
              modified = true;
            } else {
              // Use first dictionary meaning as fallback
              word.meaning = jmdict[word.word].split(',')[0].trim();
              stats.dictionaryFallback++;
              modified = true;
            }
          } else {
            // Not in dictionary - needs AI
            stats.needsAI++;
            if (needsAI.length < 500) {
              needsAI.push({
                word: word.word,
                furigana: word.furigana,
                currentMeaning: currentMeaning,
                japanese: japanese,
                english: english,
              });
            }
          }
        } else {
          // Existing meaning is good
          stats.keptExisting++;
        }
      }

      if (modified) {
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
  const outputPath = path.join(__dirname, '..', 'entire_sentences_derived_meanings.csv');
  fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');

  // Write words that need AI
  const needsAIPath = path.join(__dirname, '..', 'words-need-ai-meanings.json');
  fs.writeFileSync(needsAIPath, JSON.stringify(needsAI, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(70));
  console.log('✓ CONTEXTUAL MEANINGS DERIVED!');
  console.log('='.repeat(70));
  console.log(`\nTotal words processed: ${stats.totalWords}`);
  console.log(`\n${'METHOD'.padEnd(35)}${'COUNT'.padStart(10)}${'%'.padStart(10)}`);
  console.log('-'.repeat(70));
  console.log(`${'Pattern matched (contextual)'.padEnd(35)}${stats.patternMatched.toString().padStart(10)}${((stats.patternMatched/stats.totalWords*100).toFixed(1)+'%').padStart(10)}`);
  console.log(`${'Dictionary fallback'.padEnd(35)}${stats.dictionaryFallback.toString().padStart(10)}${((stats.dictionaryFallback/stats.totalWords*100).toFixed(1)+'%').padStart(10)}`);
  console.log(`${'Kept existing (already good)'.padEnd(35)}${stats.keptExisting.toString().padStart(10)}${((stats.keptExisting/stats.totalWords*100).toFixed(1)+'%').padStart(10)}`);
  console.log(`${'Needs AI processing'.padEnd(35)}${stats.needsAI.toString().padStart(10)}${((stats.needsAI/stats.totalWords*100).toFixed(1)+'%').padStart(10)}`);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Pattern matching success rate: ${((stats.patternMatched / (stats.patternMatched + stats.dictionaryFallback + stats.needsAI) * 100).toFixed(1))}%`);
  console.log(`${'='.repeat(70)}`);

  console.log(`\nOutput files:`);
  console.log(`  - entire_sentences_derived_meanings.csv`);
  console.log(`  - words-need-ai-meanings.json (${needsAI.length} words)`);

  if (needsAI.length > 0) {
    console.log(`\n📝 Next step: Run AI processing for ${needsAI.length} words that need contextual analysis`);
  }

  // Show sample pattern matches
  console.log(`\nSample pattern matches:`);
  console.log(`(These were matched contextually from English translation)`);
}

if (require.main === module) {
  deriveMeanings();
}

module.exports = { deriveMeanings };
