/**
 * Apply remaining AI-generated meanings
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

function applyRemaining() {
  console.log('🤖 Applying remaining AI meanings...\n');

  // Load remaining meanings
  const remainingPath = path.join(__dirname, '..', 'remaining-ai-meanings.json');
  const meaningMap = new Map(Object.entries(JSON.parse(fs.readFileSync(remainingPath, 'utf-8'))));

  console.log(`Loaded ${meaningMap.size} remaining meanings\n`);

  // Load the CSV
  const csvPath = path.join(__dirname, '..', 'entire_sentences_final.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const output = [lines[0]];
  let updatedCount = 0;

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

      if (!wordsStr || wordsStr === '[]') {
        output.push(line);
        continue;
      }

      const words = JSON.parse(wordsStr);
      let modified = false;

      for (const word of words) {
        if (!word.word) continue;

        const key = `${word.word}|${japanese}`;
        if (meaningMap.has(key)) {
          word.meaning = meaningMap.get(key);
          modified = true;
          updatedCount++;
        }
      }

      if (modified) {
        parts[3] = JSON.stringify(words);
        output.push(buildCSVLine(parts));
      } else {
        output.push(line);
      }

    } catch (e) {
      console.error(`Error updating line ${i}:`, e.message);
      output.push(line);
    }
  }

  // Write final output
  fs.writeFileSync(csvPath, output.join('\n'), 'utf-8');

  console.log('='.repeat(70));
  console.log('✓ REMAINING AI MEANINGS APPLIED');
  console.log('='.repeat(70));
  console.log(`\nUpdated word entries: ${updatedCount}`);
  console.log('='.repeat(70));
}

if (require.main === module) {
  applyRemaining();
}

module.exports = { applyRemaining };
