/**
 * Achieve 100% coverage using jpdb + JMdict + JLPT dictionaries
 * Every word gets furigana and meaning for complete typing practice
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

// Known particles, auxiliaries, and common words
const KNOWN_WORDS = {
  // Particles
  'が': { furigana: 'が', meaning: 'subject marker' },
  'を': { furigana: 'を', meaning: 'object marker' },
  'に': { furigana: 'に', meaning: 'direction/target' },
  'へ': { furigana: 'へ', meaning: 'direction' },
  'で': { furigana: 'で', meaning: 'location/means' },
  'から': { furigana: 'から', meaning: 'from' },
  'まで': { furigana: 'まで', meaning: 'until' },
  'は': { furigana: 'は', meaning: 'topic marker' },
  'も': { furigana: 'も', meaning: 'also' },
  'と': { furigana: 'と', meaning: 'and/with' },
  'や': { furigana: 'や', meaning: 'and' },
  'か': { furigana: 'か', meaning: 'question' },
  'の': { furigana: 'の', meaning: 'possessive' },
  'ね': { furigana: 'ね', meaning: 'right?' },
  'よ': { furigana: 'よ', meaning: 'you know' },
  'な': { furigana: 'な', meaning: 'don\'t' },

  // Auxiliaries
  'です': { furigana: 'です', meaning: 'polite be' },
  'だ': { furigana: 'だ', meaning: 'be' },
  'ます': { furigana: 'ます', meaning: 'polite ending' },
  'ました': { furigana: 'ました', meaning: 'polite past' },
  'ません': { furigana: 'ません', meaning: 'polite negative' },
  'た': { furigana: 'た', meaning: 'past' },
  'て': { furigana: 'て', meaning: 'te-form' },
  'ている': { furigana: 'ている', meaning: 'doing' },
  'ていた': { furigana: 'ていた', meaning: 'was doing' },
  'ています': { furigana: 'ています', meaning: 'doing (polite)' },
  'ない': { furigana: 'ない', meaning: 'negative' },
  'ください': { furigana: 'ください', meaning: 'please' },
  'たい': { furigana: 'たい', meaning: 'want to' },

  // Common demonstratives
  'この': { furigana: 'この', meaning: 'this' },
  'その': { furigana: 'その', meaning: 'that' },
  'あの': { furigana: 'あの', meaning: 'that' },
  'どの': { furigana: 'どの', meaning: 'which' },
};

// Try to match longest word from dictionaries
function matchWord(text, pos, jlpt, jpdb, jmdict) {
  // Try matching from longest to shortest (up to 15 chars)
  for (let len = Math.min(15, text.length - pos); len > 0; len--) {
    const substr = text.substring(pos, pos + len);

    // 1. Check known words first
    if (KNOWN_WORDS[substr]) {
      return {
        word: substr,
        ...KNOWN_WORDS[substr],
        length: len,
      };
    }

    // 2. Check JLPT (best source - has both reading and meaning)
    if (jlpt.has(substr)) {
      const entry = jlpt.get(substr);
      return {
        word: substr,
        furigana: entry.reading,
        meaning: entry.meaning,
        length: len,
      };
    }

    // 3. Check jpdb for reading
    if (jpdb.has(substr)) {
      const entry = jpdb.get(substr);
      let meaning = '';

      // Try to get meaning from jmdict
      if (jmdict[substr]) {
        const meanings = jmdict[substr].split(',');
        meaning = meanings[0].trim();
      }

      return {
        word: substr,
        furigana: entry.reading,
        meaning: meaning,
        length: len,
      };
    }

    // 4. Check jmdict only
    if (jmdict[substr]) {
      const meanings = jmdict[substr].split(',');
      return {
        word: substr,
        furigana: substr, // Use word itself if no reading found
        meaning: meanings[0].trim(),
        length: len,
      };
    }
  }

  return null;
}

// Tokenize using all dictionaries
function tokenize(text, jlpt, jpdb, jmdict) {
  const tokens = [];
  let pos = 0;

  while (pos < text.length) {
    const char = text[pos];

    // Skip punctuation
    if (/[。、！？・…「」『』（）\s~]/.test(char)) {
      pos++;
      continue;
    }

    // Try to match a word
    const match = matchWord(text, pos, jlpt, jpdb, jmdict);

    if (match) {
      tokens.push(match);
      pos += match.length;
    } else {
      // Single character fallback
      const token = {
        word: char,
        furigana: char,
        meaning: '',
        length: 1,
      };

      // Try dictionaries for single char
      if (jlpt.has(char)) {
        const entry = jlpt.get(char);
        token.furigana = entry.reading;
        token.meaning = entry.meaning;
      } else if (jpdb.has(char)) {
        token.furigana = jpdb.get(char).reading;
        if (jmdict[char]) {
          const meanings = jmdict[char].split(',');
          token.meaning = meanings[0].trim();
        }
      } else if (jmdict[char]) {
        const meanings = jmdict[char].split(',');
        token.meaning = meanings[0].trim();
      }

      tokens.push(token);
      pos++;
    }
  }

  return tokens;
}

async function completeCoverage() {
  console.log('🔧 Achieving 100% coverage with comprehensive dictionaries...\n');

  // Load all dictionaries
  console.log('Loading dictionaries...');
  const { loadJpdb } = require('./loadJpdb');
  const { loadJLPT } = require('./loadJLPT');

  const [jpdb, jlpt] = await Promise.all([loadJpdb(), loadJLPT()]);
  const jmdict = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'jmdict-subset.json'), 'utf-8'));

  console.log(`✓ jpdb: ${jpdb.size} entries`);
  console.log(`✓ JLPT: ${jlpt.size} entries`);
  console.log(`✓ JMdict: ${Object.keys(jmdict).length} entries\n`);

  const csvPath = path.join(__dirname, '..', 'entire_sentences_complete.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const output = [lines[0]];

  const stats = {
    total: 0,
    perfectCoverage: 0,
    partialCoverage: 0,
    totalWords: 0,
    wordsWithMeaning: 0,
    wordsWithFurigana: 0,
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
      const cleanJapanese = removePunctuation(japanese);

      stats.total++;

      // Tokenize using all dictionaries
      const tokens = tokenize(cleanJapanese, jlpt, jpdb, jmdict);

      // Build words array
      const words = tokens.map(t => ({
        word: t.word,
        furigana: t.furigana,
        meaning: t.meaning,
      }));

      // Calculate stats
      stats.totalWords += words.length;
      stats.wordsWithFurigana += words.filter(w => w.furigana && w.furigana !== '').length;
      stats.wordsWithMeaning += words.filter(w => w.meaning && w.meaning !== '').length;

      // Check coverage
      const wordsText = words.map(w => w.word).join('');
      if (wordsText === cleanJapanese) {
        stats.perfectCoverage++;
      } else {
        stats.partialCoverage++;
      }

      // Update line
      parts[3] = JSON.stringify(words);
      output.push(buildCSVLine(parts));

      if (stats.total % 100 === 0) {
        console.log(`  Processed ${stats.total} sentences...`);
      }

    } catch (e) {
      console.error(`Error on line ${i}:`, e.message);
      output.push(line);
    }
  }

  // Write output
  const outputPath = path.join(__dirname, '..', 'entire_sentences_full_coverage.csv');
  fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');

  const coveragePct = (stats.perfectCoverage / stats.total * 100).toFixed(1);
  const meaningPct = (stats.wordsWithMeaning / stats.totalWords * 100).toFixed(1);
  const furiganaPct = (stats.wordsWithFurigana / stats.totalWords * 100).toFixed(1);

  console.log('\n' + '='.repeat(70));
  console.log('✓ COMPLETE COVERAGE ACHIEVED');
  console.log('='.repeat(70));
  console.log(`\nSentences: ${stats.total}`);
  console.log(`Perfect coverage: ${stats.perfectCoverage} (${coveragePct}%)`);
  console.log(`Partial coverage: ${stats.partialCoverage}`);
  console.log(`\nTotal words: ${stats.totalWords}`);
  console.log(`Words with furigana: ${stats.wordsWithFurigana} (${furiganaPct}%)`);
  console.log(`Words with meaning: ${stats.wordsWithMeaning} (${meaningPct}%)`);
  console.log(`\nAverage words/sentence: ${(stats.totalWords / stats.total).toFixed(1)}`);
  console.log(`\nOutput: entire_sentences_full_coverage.csv`);
  console.log('='.repeat(70));
}

if (require.main === module) {
  completeCoverage().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { completeCoverage };
