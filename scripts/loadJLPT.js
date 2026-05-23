/**
 * Load JLPT vocabulary data
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

async function loadJLPT() {
  const jlptMap = new Map();

  // Load all JLPT levels
  for (const level of ['n5', 'n4', 'n3', 'n2', 'n1']) {
    const filePath = path.join(__dirname, '..', 'data', `${level}.csv`);

    if (!fs.existsSync(filePath)) {
      console.log(`Warning: ${level}.csv not found`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = parseCSVLine(line);
      if (fields.length < 3) continue;

      const expression = fields[0]?.trim();
      const reading = fields[1]?.trim();
      const meaning = fields[2]?.trim();

      if (expression && reading && meaning) {
        // Store with expression as key
        if (!jlptMap.has(expression)) {
          jlptMap.set(expression, {
            reading: reading,
            meaning: meaning,
            level: level,
          });
        }
      }
    }
  }

  console.log(`Loaded ${jlptMap.size} entries from JLPT data`);
  return jlptMap;
}

module.exports = { loadJLPT };
