require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

async function removeDots() {
  console.log('🧹 Removing dots from kanji dictionary readings...\n');

  const { data: allKanji, error } = await supabase
    .from('kanji_dictionary')
    .select('kanji, readings, readings_romaji')
    .limit(3000);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`📚 Processing ${allKanji.length} kanji...\n`);

  let updated = 0;

  for (const kanji of allKanji) {
    let needsUpdate = false;
    let cleanReadings = kanji.readings;
    let cleanRomajiReadings = kanji.readings_romaji;

    // Clean readings (remove dots)
    if (kanji.readings) {
      cleanReadings = kanji.readings.map(r => r.replace(/\./g, ''));
      if (JSON.stringify(cleanReadings) !== JSON.stringify(kanji.readings)) {
        needsUpdate = true;
      }
    }

    // Clean romaji readings (remove dots)
    if (kanji.readings_romaji) {
      cleanRomajiReadings = kanji.readings_romaji.map(r => r.replace(/\./g, ''));
      if (JSON.stringify(cleanRomajiReadings) !== JSON.stringify(kanji.readings_romaji)) {
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('kanji_dictionary')
        .update({
          readings: cleanReadings,
          readings_romaji: cleanRomajiReadings
        })
        .eq('kanji', kanji.kanji);

      if (updateError) {
        console.error(`❌ Error updating ${kanji.kanji}:`, updateError.message);
      } else {
        console.log(`✅ ${kanji.kanji}: ${kanji.readings?.join(', ')} → ${cleanReadings?.join(', ')}`);
        updated++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  console.log('\n\n🎉 Cleanup complete!');
  console.log(`✅ Updated ${updated} kanji entries`);
  console.log(`📖 ${allKanji.length - updated} entries had no dots`);
}

removeDots().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
