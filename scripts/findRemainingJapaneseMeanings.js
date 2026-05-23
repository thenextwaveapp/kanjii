/**
 * Find all remaining Japanese meanings
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

function hasJapanese(text) {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

function findRemaining() {
  console.log('🔍 Finding remaining Japanese meanings...\n');

  const csvPath = path.join(__dirname, '..', 'entire_sentences_final.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const remaining = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 4) continue;

      const japanese = parts[1];
      const english = parts[2];
      const wordsStr = parts[3];

      if (!wordsStr || wordsStr === '[]') continue;

      const words = JSON.parse(wordsStr);

      for (const word of words) {
        if (!word.word) continue;

        const meaning = (word.meaning || '').trim();

        if (hasJapanese(meaning)) {
          remaining.push({
            word: word.word,
            furigana: word.furigana,
            currentMeaning: meaning,
            japanese: japanese,
            english: english,
          });
        }
      }

    } catch (e) {
      console.error(`Error processing line ${i}:`, e.message);
    }
  }

  console.log(`Found ${remaining.length} words with Japanese meanings\n`);

  remaining.forEach((item, i) => {
    console.log(`${i + 1}. Word: ${item.word}`);
    console.log(`   Current: ${item.currentMeaning}`);
    console.log(`   JP: ${item.japanese}`);
    console.log(`   EN: ${item.english}`);
    console.log();
  });

  // Generate meanings for these
  console.log('Generating contextual English meanings...\n');

  const newMeanings = {};

  for (const item of remaining) {
    const key = `${item.word}|${item.japanese}`;

    // Derive contextual meaning
    let meaning = '';

    if (item.word === '言葉' && item.japanese.includes('社長に失礼な')) {
      meaning = 'words';
    } else if (item.word === 'しまっ' && item.japanese.includes('社長に失礼な')) {
      meaning = 'ended up';
    } else if (item.word === 'なっ' && item.japanese.includes('お世話になって')) {
      meaning = 'to be (humble)';
    } else if (item.word === '食べ' && item.japanese.includes('恵方巻き')) {
      meaning = 'ate';
    } else if (item.word === '取り' && item.japanese.includes('国際免許')) {
      meaning = 'got';
    } else if (item.word === 'なっ' && item.japanese.includes('観光になって')) {
      meaning = 'become';
    } else if (item.word === '届き' && item.japanese.includes('源泉徴収票')) {
      meaning = 'arrived';
    }

    if (meaning) {
      newMeanings[key] = meaning;
      console.log(`✓ ${item.word} → "${meaning}"`);
    }
  }

  // Save to file
  const outputPath = path.join(__dirname, '..', 'remaining-ai-meanings.json');
  fs.writeFileSync(outputPath, JSON.stringify(newMeanings, null, 2), 'utf-8');

  console.log(`\n✓ Generated ${Object.keys(newMeanings).length} meanings`);
  console.log(`Saved to: remaining-ai-meanings.json`);
}

if (require.main === module) {
  findRemaining();
}

module.exports = { findRemaining };
