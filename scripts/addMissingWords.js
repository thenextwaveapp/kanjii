/**
 * Add missing words to achieve 100% coverage
 * Uses jpdb for furigana, JMdict for meanings, and our particle definitions
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

function removePunctuation(text) {
  return text.replace(/[。、！？・…「」『』（）\s~]/g, '');
}

// Particle meanings
const PARTICLE_MEANINGS = {
  'が': 'subject marker',
  'を': 'object marker',
  'に': 'target/direction particle',
  'へ': 'direction particle',
  'で': 'location/means particle',
  'から': 'from/since',
  'まで': 'until/to',
  'より': 'than/from',
  'は': 'topic marker',
  'も': 'also/too',
  'と': 'and/with/quotation',
  'や': 'and (non-exhaustive)',
  'か': 'or/question',
  'の': 'possessive/explanatory',
  'ね': 'confirmatory particle',
  'よ': 'emphasis/assertion',
  'な': 'prohibitive/emotive',
};

const AUXILIARY_MEANINGS = {
  'です': 'polite copula',
  'だ': 'plain copula',
  'ます': 'polite verb ending',
  'まし': 'polite past stem',
  'ませ': 'polite negative stem',
  'た': 'past tense',
  'て': 'te-form connector',
  'ている': 'ongoing action',
  'ない': 'negative',
  'られる': 'passive/potential',
  'れる': 'passive/potential',
  'せる': 'causative',
  'させる': 'causative',
};

const COMMON_MEANINGS = {
  'この': 'this',
  'その': 'that',
  'あの': 'that over there',
  'どの': 'which',
  'ここ': 'here',
  'そこ': 'there',
  'あそこ': 'over there',
  'どこ': 'where',
};

// Simple tokenizer - splits on character type changes
function simpleTokenize(text) {
  const tokens = [];
  let current = '';
  let lastType = null;

  for (const char of text) {
    let type;
    if (/[\u4E00-\u9FFF]/.test(char)) {
      type = 'kanji';
    } else if (/[\u3040-\u309F]/.test(char)) {
      type = 'hiragana';
    } else if (/[\u30A0-\u30FF]/.test(char)) {
      type = 'katakana';
    } else {
      type = 'other';
    }

    // For hiragana, also break on known particles
    if (type === 'hiragana' && lastType === 'hiragana') {
      const testWord = current + char;
      const knownWords = [...Object.keys(PARTICLE_MEANINGS), ...Object.keys(AUXILIARY_MEANINGS), ...Object.keys(COMMON_MEANINGS)];

      // Check if adding this char would complete a known word
      const wouldComplete = knownWords.some(w => testWord === w);
      const currentIsComplete = knownWords.some(w => current === w);

      if (currentIsComplete && !wouldComplete) {
        tokens.push(current);
        current = char;
        lastType = type;
        continue;
      }
    }

    if (type === lastType || lastType === null) {
      current += char;
    } else {
      if (current) tokens.push(current);
      current = char;
    }
    lastType = type;
  }

  if (current) tokens.push(current);
  return tokens;
}

async function addMissingWords() {
  console.log('🔧 Adding missing words for complete coverage...\n');

  // Load jpdb
  console.log('Loading jpdb...');
  const { loadJpdb } = require('./loadJpdb');
  const jpdb = await loadJpdb();
  console.log(`Loaded ${jpdb.size} jpdb entries\n`);

  // Load JMdict
  console.log('Loading JMdict...');
  const jmdict = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'jmdict-subset.json'), 'utf-8'));
  console.log(`Loaded ${Object.keys(jmdict).length} JMdict entries\n`);

  const csvPath = path.join(__dirname, '..', 'entire_sentences_complete.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const output = [lines[0]];

  const stats = {
    totalSentences: 0,
    hadPerfectCoverage: 0,
    fixed: 0,
    wordsAdded: 0,
    couldNotFix: 0,
  };

  console.log('Processing sentences...\n');

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
      const wordsStr = parts[3];

      stats.totalSentences++;

      if (!wordsStr || wordsStr === '[]') {
        output.push(line);
        stats.couldNotFix++;
        continue;
      }

      const words = JSON.parse(wordsStr);
      const cleanJapanese = removePunctuation(japanese);
      const wordsText = words.map(w => w.word).join('');
      const cleanWordsText = removePunctuation(wordsText);

      // Check if already perfect
      if (cleanJapanese === cleanWordsText) {
        stats.hadPerfectCoverage++;
        output.push(line);
        continue;
      }

      // Find missing parts by matching existing words
      let position = 0;
      const newWords = [];

      for (let j = 0; j < words.length; j++) {
        const word = words[j];
        const wordClean = removePunctuation(word.word);

        // Find where this word appears in the clean text
        const wordPos = cleanJapanese.indexOf(wordClean, position);

        if (wordPos === -1) {
          // Word not found - skip it or keep as-is
          newWords.push(word);
          continue;
        }

        // Add any missing text before this word
        if (wordPos > position) {
          const missingText = cleanJapanese.substring(position, wordPos);
          const missingTokens = simpleTokenize(missingText);

          for (const token of missingTokens) {
            const newWord = {
              word: token,
              furigana: '',
              meaning: '',
            };

            // Try to get furigana from jpdb
            if (jpdb.has(token)) {
              newWord.furigana = jpdb.get(token).reading;
            } else {
              // If all hiragana/katakana, use as-is
              if (/^[\u3040-\u309F\u30A0-\u30FF]+$/.test(token)) {
                newWord.furigana = token;
              }
            }

            // Try to get meaning
            if (PARTICLE_MEANINGS[token]) {
              newWord.meaning = PARTICLE_MEANINGS[token];
            } else if (AUXILIARY_MEANINGS[token]) {
              newWord.meaning = AUXILIARY_MEANINGS[token];
            } else if (COMMON_MEANINGS[token]) {
              newWord.meaning = COMMON_MEANINGS[token];
            } else if (jmdict[token]) {
              const meanings = jmdict[token].split(',');
              newWord.meaning = meanings[0].trim();
            }

            newWords.push(newWord);
            stats.wordsAdded++;
          }
        }

        // Add the existing word
        newWords.push(word);
        position = wordPos + wordClean.length;
      }

      // Add any remaining text at the end
      if (position < cleanJapanese.length) {
        const missingText = cleanJapanese.substring(position);
        const missingTokens = simpleTokenize(missingText);

        for (const token of missingTokens) {
          const newWord = {
            word: token,
            furigana: '',
            meaning: '',
          };

          if (jpdb.has(token)) {
            newWord.furigana = jpdb.get(token).reading;
          } else if (/^[\u3040-\u309F\u30A0-\u30FF]+$/.test(token)) {
            newWord.furigana = token;
          }

          if (PARTICLE_MEANINGS[token]) {
            newWord.meaning = PARTICLE_MEANINGS[token];
          } else if (AUXILIARY_MEANINGS[token]) {
            newWord.meaning = AUXILIARY_MEANINGS[token];
          } else if (COMMON_MEANINGS[token]) {
            newWord.meaning = COMMON_MEANINGS[token];
          } else if (jmdict[token]) {
            const meanings = jmdict[token].split(',');
            newWord.meaning = meanings[0].trim();
          }

          newWords.push(newWord);
          stats.wordsAdded++;
        }
      }

      // Update the line
      parts[3] = JSON.stringify(newWords);
      output.push(buildCSVLine(parts));
      stats.fixed++;

      if (stats.fixed % 100 === 0) {
        console.log(`  Processed ${stats.fixed}/${stats.totalSentences} sentences...`);
      }

    } catch (e) {
      console.error(`Error processing line ${i}:`, e.message);
      output.push(line);
      stats.couldNotFix++;
    }
  }

  // Write output
  const outputPath = path.join(__dirname, '..', 'entire_sentences_full_coverage.csv');
  fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');

  console.log('\n' + '='.repeat(70));
  console.log('✓ COMPLETE COVERAGE PROCESSING DONE');
  console.log('='.repeat(70));
  console.log(`\nTotal sentences: ${stats.totalSentences}`);
  console.log(`Already had perfect coverage: ${stats.hadPerfectCoverage}`);
  console.log(`Fixed with missing words: ${stats.fixed}`);
  console.log(`Total words added: ${stats.wordsAdded}`);
  console.log(`Could not fix: ${stats.couldNotFix}`);
  console.log(`\nOutput: entire_sentences_full_coverage.csv`);
  console.log('='.repeat(70));
}

if (require.main === module) {
  addMissingWords().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { addMissingWords };
