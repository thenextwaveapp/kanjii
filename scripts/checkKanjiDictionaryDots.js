require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { toRomaji } = require('wanakana');
const ws = require('ws');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

async function checkKanjiDictionary() {
  console.log('🔍 Checking kanji_dictionary for dots in readings...\n');

  // First check the specific kanji the user mentioned (食 - eat)
  const { data: eatKanji } = await supabase
    .from('kanji_dictionary')
    .select('*')
    .eq('kanji', '食')
    .single();

  if (eatKanji) {
    console.log('📝 Kanji 食 (eat) details:\n');
    console.log('Meanings:', eatKanji.meanings);
    console.log('Readings:', eatKanji.readings);
    console.log('Readings Romaji:', eatKanji.readings_romaji);

    console.log('\nReadings converted to romaji:');
    eatKanji.readings?.forEach(reading => {
      const romaji = toRomaji(reading);
      console.log(`  "${reading}" → "${romaji}"`);
      if (romaji.includes('.')) {
        console.log(`    ⚠️  Contains dot!`);
      }
    });

    if (eatKanji.readings_romaji) {
      console.log('\nStored readings_romaji:');
      eatKanji.readings_romaji.forEach(romaji => {
        console.log(`  "${romaji}"`);
        if (romaji.includes('.')) {
          console.log(`    ⚠️  Contains dot!`);
        }
      });
    }
  }

  // Now check all kanji for dots
  const { data: allKanji } = await supabase
    .from('kanji_dictionary')
    .select('kanji, readings, readings_romaji')
    .limit(3000);

  const withDots = [];

  allKanji?.forEach(k => {
    // Check readings
    k.readings?.forEach(reading => {
      if (reading.includes('.') || reading.includes('・')) {
        withDots.push({
          kanji: k.kanji,
          type: 'reading',
          value: reading,
          romaji: toRomaji(reading)
        });
      }
    });

    // Check romaji readings
    k.readings_romaji?.forEach(romaji => {
      if (romaji.includes('.')) {
        withDots.push({
          kanji: k.kanji,
          type: 'romaji',
          value: romaji
        });
      }
    });
  });

  console.log(`\n\n📊 Found ${withDots.length} entries with dots:\n`);

  // Group by type
  const byType = withDots.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  console.log('By type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\nExamples:\n');
  withDots.slice(0, 30).forEach(item => {
    if (item.type === 'reading') {
      console.log(`Kanji: ${item.kanji} | Reading: "${item.value}" → Romaji: "${item.romaji}"`);
    } else {
      console.log(`Kanji: ${item.kanji} | Stored Romaji: "${item.value}"`);
    }
  });

  if (withDots.length > 30) {
    console.log(`\n... and ${withDots.length - 30} more`);
  }

  // Save full report
  const fs = require('fs');
  fs.writeFileSync('./kanji-dictionary-dots.json', JSON.stringify(withDots, null, 2));
  console.log(`\n✅ Full report saved to: ./kanji-dictionary-dots.json`);
}

checkKanjiDictionary().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
