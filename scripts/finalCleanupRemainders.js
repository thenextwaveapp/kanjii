/**
 * Final cleanup - add remaining common words and patterns
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

// Additional common words and patterns from the remainders
const ADDITIONAL_MEANINGS = {
  // Small tsu
  'っ': 'gemination marker',

  // Numbers
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  '10': 'ten',

  // Placeholder
  '◯': 'circle/placeholder',

  // Common locations
  '東京': 'Tokyo',
  '大阪': 'Osaka',
  '京都': 'Kyoto',
  '日本': 'Japan',

  // Common words
  '本当に': 'really',
  'お客様': 'customer (honorific)',
  'ご飯': 'rice/meal',
  'お金': 'money',
  'お店': 'shop',
  'お願い': 'request/please',
  'ありがとう': 'thank you',
  'すみません': 'excuse me/sorry',
  'おはよう': 'good morning',
  'こんにちは': 'hello',
  'こんばんは': 'good evening',
  'さようなら': 'goodbye',

  // More conjugation patterns
  'けど': 'but',
  'けれど': 'but',
  'けれども': 'however',
  'には': 'to/in (emphasis)',
  'では': 'in that case',
  'じゃ': 'then/well',
  'さん': 'Mr./Ms.',
  'さま': 'Mr./Ms. (honorific)',
  'ちゃん': 'affectionate suffix',
  'くん': 'Mr. (for boys)',
  'さ': 'masculine particle',
  'め': 'eye/suffix',
  'つけ': 'attach (stem)',
  'つける': 'to attach',
  'がい': 'value/worth',
  'おり': 'humble form of いる',
  'がき': 'brat',
  'れい': 'zero/example',
  'すぎ': 'too much',
  'すぎる': 'too much/exceed',
  'んだ': 'explanatory (casual)',
  'んです': 'explanatory (polite)',
  'てし': 'te-form stem',
  'し': 'and/conjunction',
  'はと': 'pigeon',
  'まず': 'first',
  'もう': 'already/more',
  'まだ': 'not yet/still',
  'ずっと': 'all along',
  'やっぱり': 'as expected',
  'たぶん': 'probably',
  'きっと': 'surely',
  'ぜんぜん': 'not at all',
  'とても': 'very',
  'ちょっと': 'a little',
  'たくさん': 'a lot',
  'みんな': 'everyone',
  'ひとり': 'one person/alone',
  'ふたり': 'two people',

  // Common verb stems (for incomplete tokenization)
  '買': 'buy (kanji)',
  '待': 'wait (kanji)',
  '忘': 'forget (kanji)',
  '食': 'eat (kanji)',
  '飲': 'drink (kanji)',
  '見': 'see/watch (kanji)',
  '聞': 'hear/listen (kanji)',
  '行': 'go (kanji)',
  '来': 'come (kanji)',
  '帰': 'return (kanji)',
  '話': 'speak (kanji)',
  '書': 'write (kanji)',
  '読': 'read (kanji)',
  '思': 'think (kanji)',
  '知': 'know (kanji)',
  '分': 'understand (kanji)',
  '使': 'use (kanji)',
  '働': 'work (kanji)',
  '勉強': 'study',
  '仕事': 'work/job',
  '会社': 'company',
  '学校': 'school',
  '先生': 'teacher',
  '学生': 'student',
  '友達': 'friend',
  '家族': 'family',
  '時間': 'time',
  '今日': 'today',
  '明日': 'tomorrow',
  '昨日': 'yesterday',
  '毎日': 'every day',
};

async function finalCleanup() {
  console.log('🧹 Final cleanup - adding remainders...\n');

  const csvPath = path.join(__dirname, '..', 'entire_sentences_full_coverage.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const output = [lines[0]];
  let meaningsAdded = 0;
  let totalWords = 0;
  let wordsWithMeaning = 0;

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
        totalWords++;

        if (!word.meaning || word.meaning.trim() === '') {
          // Check if we have a meaning for this word
          if (ADDITIONAL_MEANINGS[word.word]) {
            word.meaning = ADDITIONAL_MEANINGS[word.word];
            modified = true;
            meaningsAdded++;
          }
        }

        if (word.meaning && word.meaning.trim() !== '') {
          wordsWithMeaning++;
        }
      }

      if (modified) {
        parts[3] = JSON.stringify(words);
        output.push(buildCSVLine(parts));
      } else {
        output.push(line);
      }

    } catch (e) {
      console.error(`Error on line ${i}:`, e.message);
      output.push(line);
    }
  }

  // Write output
  fs.writeFileSync(csvPath, output.join('\n'), 'utf-8');

  const meaningPct = (wordsWithMeaning / totalWords * 100).toFixed(1);

  console.log('='.repeat(70));
  console.log('✓ FINAL CLEANUP COMPLETE');
  console.log('='.repeat(70));
  console.log(`\nMeanings added: ${meaningsAdded}`);
  console.log(`Total words: ${totalWords}`);
  console.log(`Words with meanings: ${wordsWithMeaning} (${meaningPct}%)`);
  console.log('='.repeat(70));
}

if (require.main === module) {
  finalCleanup().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { finalCleanup };
