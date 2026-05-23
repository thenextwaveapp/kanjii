/**
 * Parse JMdict XML into a lightweight JSON dictionary
 * Only extract words we actually need from our sentences
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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

// Get list of words we need meanings for
function getWordsNeeded() {
  const csvPath = path.join(__dirname, '..', 'entire_sentences_final.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const words = new Set();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 4) continue;

      const wordsStr = parts[3];
      if (!wordsStr || wordsStr === '[]') continue;

      const wordsList = JSON.parse(wordsStr);

      for (const word of wordsList) {
        if (word.word) {
          words.add(word.word);
        }
      }
    } catch (e) {
      // Skip
    }
  }

  return words;
}

function parseJMdict() {
  console.log('📖 Parsing JMdict...\n');

  const wordsNeeded = getWordsNeeded();
  console.log(`Found ${wordsNeeded.size} unique words in sentences`);

  const jmdictPath = path.join(__dirname, '..', 'JMdict_e');

  // Use grep and simple parsing - much faster than XML parsing
  console.log('Extracting relevant entries from JMdict...');

  // Create a simple dictionary by parsing the XML line by line
  const dictionary = new Map();
  let currentEntry = null;
  let currentKanji = '';
  let currentReading = '';
  let inSense = false;
  let glosses = [];

  const stream = fs.createReadStream(jmdictPath, { encoding: 'utf8' });
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('<entry>')) {
        currentEntry = {};
        currentKanji = '';
        currentReading = '';
        glosses = [];
        inSense = false;
      } else if (trimmed.startsWith('<keb>')) {
        currentKanji = trimmed.replace(/<\/?keb>/g, '');
      } else if (trimmed.startsWith('<reb>')) {
        currentReading = trimmed.replace(/<\/?reb>/g, '');
      } else if (trimmed.startsWith('<sense>')) {
        inSense = true;
        glosses = [];
      } else if (trimmed.startsWith('</sense>')) {
        inSense = false;
      } else if (inSense && trimmed.startsWith('<gloss>')) {
        const gloss = trimmed
          .replace(/<gloss[^>]*>/, '')
          .replace(/<\/gloss>/, '')
          .trim();
        if (gloss) {
          glosses.push(gloss);
        }
      } else if (trimmed.startsWith('</entry>')) {
        // Save entry if it matches one of our words
        const term = currentKanji || currentReading;
        if (term && wordsNeeded.has(term) && glosses.length > 0) {
          if (!dictionary.has(term)) {
            dictionary.set(term, glosses.slice(0, 3).join(', '));
          }
        }
      }
    }
  });

  stream.on('end', () => {
    console.log(`\n✓ Extracted ${dictionary.size} definitions from JMdict`);

    // Save dictionary
    const dictPath = path.join(__dirname, '..', 'jmdict-subset.json');
    const dictObj = Object.fromEntries(dictionary);
    fs.writeFileSync(dictPath, JSON.stringify(dictObj, null, 2), 'utf-8');

    console.log(`Saved to: jmdict-subset.json`);

    // Show sample
    console.log(`\nSample entries:`);
    const samples = Array.from(dictionary.entries()).slice(0, 10);
    samples.forEach(([word, meaning]) => {
      console.log(`  ${word} = ${meaning}`);
    });
  });
}

if (require.main === module) {
  parseJMdict();
}

module.exports = { parseJMdict };
