const fs = require('fs');
const path = require('path');

// Read the kanji dictionary JSON
const dictionaryPath = process.argv[2] || '/Users/mayowarosanwo/Downloads/nihongo-master/data/dictionary-character-data.json';
const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));

// Generate SQL
const sqlStatements = [];

// Create table
sqlStatements.push(`
-- Kanji dictionary table
CREATE TABLE IF NOT EXISTS kanji_dictionary (
  kanji TEXT PRIMARY KEY,
  meaning TEXT NOT NULL,
  readings TEXT[] NOT NULL,
  stroke_paths JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kanji_dictionary ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "kanji_dictionary_read" ON kanji_dictionary
  FOR SELECT USING (true);

-- Insert kanji data
`);

// Generate insert statements
dictionary.forEach(([kanji, meaning, readingsStr, strokePaths]) => {
  // Split readings by slash and clean up
  const readings = readingsStr.split('/').map(r => r.trim()).filter(Boolean);

  // Escape single quotes in meaning
  const escapedMeaning = meaning.replace(/'/g, "''");

  // Convert readings array to SQL array format
  const readingsArray = `ARRAY[${readings.map(r => `'${r.replace(/'/g, "''")}'`).join(', ')}]`;

  // Convert stroke paths to JSON string
  const strokePathsJson = JSON.stringify(strokePaths).replace(/'/g, "''");

  sqlStatements.push(
    `INSERT INTO kanji_dictionary (kanji, meaning, readings, stroke_paths) VALUES ('${kanji}', '${escapedMeaning}', ${readingsArray}, '${strokePathsJson}'::jsonb) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings, stroke_paths = EXCLUDED.stroke_paths;`
  );
});

// Write to SQL file
const outputPath = path.join(__dirname, '..', 'supabase', 'kanji_dictionary.sql');
fs.writeFileSync(outputPath, sqlStatements.join('\n'));

console.log(`✅ Generated SQL file with ${dictionary.length} kanji`);
console.log(`📁 Output: ${outputPath}`);
console.log('\nNext steps:');
console.log('1. Run this SQL in your Supabase SQL editor');
console.log('2. Update the app to fetch from kanji_dictionary table');
