/**
 * Fix Japanese meanings to English:
 * 1. Try JMdict + pattern matching first
 * 2. Flag remainder for AI processing
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

function hasJapanese(text) {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

function findContextualMeaning(word, dictMeanings, englishTranslation) {
  if (!dictMeanings || !englishTranslation) return null;

  const english = englishTranslation.toLowerCase();
  const meanings = dictMeanings.split(',').map(m => m.trim());

  // Try exact word matches
  for (const meaning of meanings) {
    const meaningLower = meaning.toLowerCase();
    const escapedMeaning = meaningLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedMeaning}\\b`, 'i');
    if (regex.test(english)) {
      return meaning;
    }
  }

  // Try partial matches for longer meanings
  for (const meaning of meanings) {
    const meaningLower = meaning.toLowerCase();
    const meaningWords = meaningLower.split(/\s+/);

    for (const mword of meaningWords) {
      if (mword.length >= 4 && english.includes(mword)) {
        return meaning;
      }
    }
  }

  // Return first meaning as fallback
  return meanings[0];
}

function fixJapaneseMeanings() {
  console.log('🔧 Fixing Japanese meanings to English...\n');

  // Load JMdict
  const dictPath = path.join(__dirname, '..', 'jmdict-subset.json');
  const jmdict = JSON.parse(fs.readFileSync(dictPath, 'utf-8'));
  console.log(`Loaded ${Object.keys(jmdict).length} definitions from JMdict\n`);

  const csvPath = path.join(__dirname, '..', 'entire_sentences_final.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const output = [lines[0]];

  const stats = {
    totalWords: 0,
    japaneseMeanings: 0,
    fixedFromJMdict: 0,
    patternMatched: 0,
    dictionaryFallback: 0,
    stillNeedsAI: 0,
  };

  const needsAI = [];

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

        // Check if meaning is in Japanese
        if (hasJapanese(currentMeaning)) {
          stats.japaneseMeanings++;

          // Try to fix from JMdict
          if (jmdict[word.word]) {
            stats.fixedFromJMdict++;

            // Try pattern matching
            const contextualMeaning = findContextualMeaning(
              word.word,
              jmdict[word.word],
              english
            );

            if (contextualMeaning) {
              // Check if pattern matched vs fallback
              const meanings = jmdict[word.word].split(',');
              if (meanings[0].trim() === contextualMeaning) {
                stats.dictionaryFallback++;
              } else {
                stats.patternMatched++;
              }

              word.meaning = contextualMeaning;
              modified = true;
            }
          } else {
            // Not in JMdict - needs AI
            stats.stillNeedsAI++;
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
  const outputPath = path.join(__dirname, '..', 'entire_sentences_english_meanings.csv');
  fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');

  // Write AI candidates
  const aiPath = path.join(__dirname, '..', 'words-still-need-ai.json');
  fs.writeFileSync(aiPath, JSON.stringify(needsAI, null, 2), 'utf-8');

  console.log('='.repeat(70));
  console.log('✓ JAPANESE → ENGLISH CONVERSION');
  console.log('='.repeat(70));

  console.log(`\nTotal words: ${stats.totalWords}`);
  console.log(`Japanese meanings found: ${stats.japaneseMeanings}`);
  console.log(`\n${'METHOD'.padEnd(35)}${'COUNT'.padStart(10)}${'%'.padStart(10)}`);
  console.log('-'.repeat(70));

  const fixedPct = (stats.fixedFromJMdict / stats.japaneseMeanings * 100).toFixed(1);
  const aiPct = (stats.stillNeedsAI / stats.japaneseMeanings * 100).toFixed(1);

  console.log(`${'Fixed from JMdict:'.padEnd(35)}${stats.fixedFromJMdict.toString().padStart(10)}${(fixedPct + '%').padStart(10)}`);
  console.log(`${'  - Pattern matched'.padEnd(35)}${stats.patternMatched.toString().padStart(10)}`);
  console.log(`${'  - Dict fallback (1st meaning)'.padEnd(35)}${stats.dictionaryFallback.toString().padStart(10)}`);
  console.log(`${'Still needs AI:'.padEnd(35)}${stats.stillNeedsAI.toString().padStart(10)}${(aiPct + '%').padStart(10)}`);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Dictionary fixed: ${stats.fixedFromJMdict}/${stats.japaneseMeanings} (${fixedPct}%)`);
  console.log(`Remaining for AI: ${stats.stillNeedsAI} (${aiPct}%)`);
  console.log(`${'='.repeat(70)}`);

  console.log(`\nOutput files:`);
  console.log(`  - entire_sentences_english_meanings.csv`);
  console.log(`  - words-still-need-ai.json (${needsAI.length} words)`);

  if (needsAI.length > 0) {
    console.log(`\n📝 Sample words still needing AI:`);
    needsAI.slice(0, 10).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.word} (current: "${item.currentMeaning}")`);
      console.log(`     JP: ${item.japanese}`);
      console.log(`     EN: ${item.english}`);
    });
  }
}

if (require.main === module) {
  fixJapaneseMeanings();
}

module.exports = { fixJapaneseMeanings };
