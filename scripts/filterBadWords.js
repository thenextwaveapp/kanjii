/**
 * Filter out particles, auxiliaries, and punctuation from words array
 * Keep only learnable content words
 */

const fs = require('fs');
const path = require('path');

// Comprehensive blacklist of words that should NOT be in the words array
const PARTICLE_BLACKLIST = new Set([
  // Basic particles
  'の', 'は', 'に', 'を', 'と', 'も', 'が', 'で', 'から', 'へ', 'や', 'か', 'よ', 'ね', 'な',
  'だけ', 'まで', 'し', 'より', 'ほど', 'など', 'ばかり', 'しか', 'くらい', 'ぐらい',

  // Compound particles
  'には', 'にも', 'では', 'とは', 'のに', 'とか', 'ので', 'のは', 'のを', 'のが', 'のも',
  'ても', 'でも', 'から', 'ため', 'として', 'により', 'によって', 'において', 'による',
  'ながら', 'つつ', 'ように', 'ような', 'ために',

  // Copula and auxiliaries
  'だ', 'です', 'である', 'だった', 'でした', 'だろう', 'でしょう', 'ます', 'ました',
  'ません', 'ませんでした', 'まし', 'ませ', 'まする',

  // Negation
  'ない', 'ぬ', 'ん', 'じゃない', 'ではない', 'ないです', 'なかった', 'んだ', 'のだ',

  // Te-form auxiliaries
  'て', 'で', 'た', 'だ', 'てる', 'でる', 'ている', 'でいる', 'ておく', 'でおく',
  'てある', 'である', 'てしまう', 'でしまう', 'ちゃう', 'ちまう',

  // Honorifics/Politeness
  'さん', 'くん', 'ちゃん', 'さま', '様', '殿', '氏',

  // Question/Emphasis
  'か', 'かい', 'かな', 'ぞ', 'ぜ', 'わ', 'さ', 'っけ', 'の', 'のか', 'んだ', 'んです',

  // Conjunctions
  'って', 'という', 'といった', 'とは', 'とか', 'とも', 'とする', 'とした',

  // Punctuation
  '。', '、', '！', '？', '!', '?', '.', ',', '…', '・', '～', '〜',

  // Common demonstratives (debatable - some might want to keep these)
  // Commented out for now, can be uncommented if needed
  // 'この', 'その', 'あの', 'どの', 'これ', 'それ', 'あれ', 'どれ',
  // 'ここ', 'そこ', 'あそこ', 'どこ', 'こう', 'そう', 'ああ', 'どう',
  // 'こんな', 'そんな', 'あんな', 'どんな',
]);

// Additional check: words that are ONLY hiragana and very short (1-2 chars) are likely particles
function isLikelyParticle(word) {
  // Check if word is in blacklist
  if (PARTICLE_BLACKLIST.has(word)) return true;

  // Check if it's pure hiragana and very short
  const isHiragana = /^[\u3040-\u309F]+$/.test(word);
  if (isHiragana && word.length <= 2) {
    // Likely a particle, but check for exceptions (e.g., 目, 手 in hiragana form would be め, て)
    // For now, we'll be conservative and not auto-filter short hiragana
    return false;
  }

  return false;
}

// Check if word is just punctuation
function isPunctuation(word) {
  return /^[。、！？!?.,…・～〜\s]+$/.test(word);
}

// Check if word has empty or generic meaning
function hasBadMeaning(meaning) {
  if (!meaning || meaning.trim() === '') return true;

  const lower = meaning.toLowerCase().trim();
  const genericMeanings = [
    'noun', 'verb', 'adjective', 'adverb', 'particle', 'auxiliary',
    'auxiliary verb', 'copula', 'conjunction', 'interjection',
    'prefix', 'suffix', 'counter', 'pronoun',
  ];

  return genericMeanings.includes(lower);
}

function filterWords(words) {
  if (!words || !Array.isArray(words)) return words;

  return words.filter(w => {
    // Remove if word is missing
    if (!w.word || w.word.trim() === '') return false;

    // Remove if it's a particle
    if (isLikelyParticle(w.word)) return false;

    // Remove if it's just punctuation
    if (isPunctuation(w.word)) return false;

    // Remove if it has a bad/generic meaning
    if (hasBadMeaning(w.meaning)) return false;

    return true;
  });
}

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

function processCSV() {
  const csvPath = path.join(__dirname, '..', 'entire_sentences.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  // Keep header
  const output = [lines[0]];

  let totalRemoved = 0;
  let sentencesModified = 0;

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
      const originalCount = words.length;
      const filtered = filterWords(words);
      const removedCount = originalCount - filtered.length;

      if (removedCount > 0) {
        totalRemoved += removedCount;
        sentencesModified++;

        // Rebuild the line with filtered words
        parts[3] = JSON.stringify(filtered);
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
  const outputPath = path.join(__dirname, '..', 'entire_sentences_filtered.csv');
  fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');

  console.log(`\n✓ Filtering complete!`);
  console.log(`  - Removed ${totalRemoved} bad words from ${sentencesModified} sentences`);
  console.log(`  - Output: entire_sentences_filtered.csv`);
}

if (require.main === module) {
  processCSV();
}

module.exports = { filterWords, isLikelyParticle, isPunctuation, hasBadMeaning };
