const fs = require('fs');
const xml2js = require('xml2js');
const { toRomaji } = require('wanakana');

async function parseKanjidic2() {
  console.log('📖 Reading KANJIDIC2...');
  const xmlData = fs.readFileSync('/Users/mayowarosanwo/Downloads/kanjidic2.xml', 'utf8');

  console.log('⚙️  Parsing XML...');
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xmlData);

  const characters = result.kanjidic2.character;
  console.log(`✅ Found ${characters.length} kanji\n`);

  const kanjiData = [];

  for (const char of characters) {
    const literal = char.literal[0];

    // Extract English meanings
    const meanings = [];
    if (char.reading_meaning && char.reading_meaning[0].rmgroup) {
      const rmgroup = char.reading_meaning[0].rmgroup[0];
      if (rmgroup.meaning) {
        rmgroup.meaning.forEach(m => {
          // Only get English meanings (ones without m_lang attribute or m_lang='en')
          if (typeof m === 'string') {
            meanings.push(m);
          } else if (m._ && (!m.$ || m.$.m_lang === 'en')) {
            meanings.push(m._);
          }
        });
      }
    }

    // Extract readings (on-yomi and kun-yomi)
    const readings = [];
    if (char.reading_meaning && char.reading_meaning[0].rmgroup) {
      const rmgroup = char.reading_meaning[0].rmgroup[0];
      if (rmgroup.reading) {
        rmgroup.reading.forEach(r => {
          const type = r.$.r_type;
          if (type === 'ja_on' || type === 'ja_kun') {
            readings.push(r._);
          }
        });
      }
    }

    if (meanings.length > 0) {
      // Convert readings to romaji
      const readingsRomaji = readings.map(r => toRomaji(r).toLowerCase());

      kanjiData.push({
        kanji: literal,
        meaning: meanings[0], // Primary meaning
        meanings: meanings,   // All meanings
        readings: readings,
        readingsRomaji: readingsRomaji
      });
    }
  }

  console.log(`💾 Processed ${kanjiData.length} kanji with meanings`);

  // Save as JSON
  const outputPath = '/Users/mayowarosanwo/Downloads/kanjidic2-parsed.json';
  fs.writeFileSync(outputPath, JSON.stringify(kanjiData, null, 2));
  console.log(`✅ Saved to ${outputPath}`);
}

parseKanjidic2().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
