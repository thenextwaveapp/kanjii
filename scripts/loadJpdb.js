/**
 * Load jpdb frequency list into a fast lookup Map
 * Returns: Map<term, {reading, frequency}>
 */

const fs = require('fs');
const path = require('path');

function loadJpdb() {
  const jpdbPath = path.join(__dirname, '..', 'jpdb_v2.2_freq_list_2024-10-13 (1).csv');
  const content = fs.readFileSync(jpdbPath, 'utf-8');
  const lines = content.split('\n');

  const jpdbMap = new Map();

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const term = parts[0];
    const reading = parts[1];
    const frequency = parseInt(parts[2], 10);

    if (!term || !reading) continue;

    // Store in map - if multiple entries, keep the one with lower frequency (more common)
    if (!jpdbMap.has(term) || jpdbMap.get(term).frequency > frequency) {
      jpdbMap.set(term, { reading, frequency });
    }
  }

  console.log(`Loaded ${jpdbMap.size} entries from jpdb`);
  return jpdbMap;
}

module.exports = { loadJpdb };
