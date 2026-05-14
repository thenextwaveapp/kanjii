const fs = require('fs');
const path = require('path');

// Read the kanji dictionary JSON
const dictionaryPath = process.argv[2] || '/Users/mayowarosanwo/Downloads/nihongo-master/data/dictionary-character-data.json';
const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));

// Generate SQL
const sqlStatements = [];

// Create table (without stroke_paths to keep it smaller)
sqlStatements.push(`
-- Kanji dictionary table (lite version without stroke paths)
CREATE TABLE IF NOT EXISTS kanji_dictionary (
  kanji TEXT PRIMARY KEY,
  meaning TEXT NOT NULL,
  readings TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kanji_dictionary ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "kanji_dictionary_read" ON kanji_dictionary
  FOR SELECT USING (true);
`);

// Split into chunks of 100 kanji each for smaller files
const chunkSize = 100;
for (let i = 0; i < dictionary.length; i += chunkSize) {
  const chunk = dictionary.slice(i, i + chunkSize);
  const fileName = `kanji_dictionary_part${Math.floor(i / chunkSize) + 1}.sql`;

  const chunkStatements = [];
  if (i === 0) {
    chunkStatements.push(sqlStatements[0]); // Add table creation to first file
  }

  chunkStatements.push('\n-- Insert kanji data\n');

  chunk.forEach(([kanji, meaning, readingsStr]) => {
    const readings = readingsStr.split('/').map(r => r.trim()).filter(Boolean);
    const escapedMeaning = meaning.replace(/'/g, "''");
    const readingsArray = `ARRAY[${readings.map(r => `'${r.replace(/'/g, "''")}'`).join(', ')}]`;

    chunkStatements.push(
      `INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('${kanji}', '${escapedMeaning}', ${readingsArray}) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;`
    );
  });

  const outputPath = path.join(__dirname, '..', 'supabase', fileName);
  fs.writeFileSync(outputPath, chunkStatements.join('\n'));
  console.log(`✅ Created ${fileName} with ${chunk.length} kanji`);
}

console.log(`\n📁 Total: ${Math.ceil(dictionary.length / chunkSize)} files created`);
console.log('\nNext steps:');
console.log('1. Run each SQL file in Supabase SQL editor (in order: part1, part2, etc.)');
console.log('2. Or use psql to run them all at once');
