// Node.js version of vocab service for bulk generation scripts
const fs = require('fs');
const path = require('path');

const vocabCache = {};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function loadVocabFile(level) {
  if (vocabCache[level]) {
    return vocabCache[level];
  }

  const filePath = path.join(__dirname, '../data', `${level.toLowerCase()}.csv`);

  if (!fs.existsSync(filePath)) {
    console.error(`Vocab file not found: ${filePath}`);
    console.error('Please download vocab files. See data/README.md');
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const words = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const [expression, reading, meaning, tags] = parseCSVLine(lines[i]);

    if (expression && reading && meaning) {
      words.push({
        expression: expression.replace(/^"|"$/g, ''),
        reading: reading.replace(/^"|"$/g, ''),
        meaning: meaning.replace(/^"|"$/g, ''),
        tags: tags || '',
        level,
      });
    }
  }

  vocabCache[level] = words;
  return words;
}

function getVocabByLevel(level) {
  if (level === 'Mixed') {
    const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
    const randomLevel = levels[Math.floor(Math.random() * levels.length)];
    return loadVocabFile(randomLevel);
  }

  return loadVocabFile(level);
}

function getRandomWord(level) {
  const words = getVocabByLevel(level);

  if (words.length === 0) {
    return null;
  }

  return words[Math.floor(Math.random() * words.length)];
}

function getRandomWords(level, count = 5) {
  const words = getVocabByLevel(level);

  if (words.length === 0) {
    return [];
  }

  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, words.length));
}

module.exports = {
  loadVocabFile,
  getVocabByLevel,
  getRandomWord,
  getRandomWords,
};
