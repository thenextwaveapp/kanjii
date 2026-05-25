import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { toHiragana } from 'wanakana';
import ws from 'ws';
import 'dotenv/config';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    realtime: {
      transport: ws,
    },
  }
);

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
});

const BATCH_SIZE = 10;
const DELAY_MS = 500; // be polite to the API

async function getReadingsStructured(kanji, readings, currentMeanings) {
  // Convert all readings to hiragana before processing
  const hiraganaReadings = readings.map(r => toHiragana(r));

  const prompt = `You are a Japanese language expert. For the kanji "${kanji}", provide specific meanings for each reading.

Current readings: ${JSON.stringify(hiraganaReadings)}
Current shared meanings: ${JSON.stringify(currentMeanings)}

Return ONLY a JSON object in this exact format, no explanation:
{
  "onyomi": [
    {"reading": "ひらがな", "meaning": "specific English meaning for this reading"}
  ],
  "kunyomi": [
    {"reading": "ひらがな", "meaning": "specific English meaning for this reading"}
  ],
  "nanori": []
}

Rules:
- ALL readings must be in hiragana — no katakana allowed
- onyomi are Chinese-derived readings (originally katakana, now converted to hiragana)
- kunyomi are native Japanese readings (already hiragana)
- Each reading should have its own specific, accurate meaning
- Meanings should be concise (under 8 words)
- If a reading is a suffix/prefix, note that (e.g. "-teki: ~-like, ~-ish")
- nanori are name readings, include if any exist`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function main() {
  console.log('Fetching kanji from database...');

  const { data: kanjiList, error } = await supabase
    .from('kanji_dictionary')
    .select('kanji, readings, meanings, readings_structured')
    .order('kanji')
    .range(0, 10000);

  if (error) {
    console.error('Failed to fetch kanji:', error);
    process.exit(1);
  }

  // Filter to only those with empty readings_structured
  const toProcess = kanjiList.filter(k => {
    const rs = k.readings_structured;
    if (!rs) return true;
    return rs.onyomi?.length === 0 && rs.kunyomi?.length === 0;
  });

  console.log(`Found ${kanjiList.length} total kanji, ${toProcess.length} need readings_structured populated.`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toProcess.length / BATCH_SIZE)} (${i + 1}-${Math.min(i + BATCH_SIZE, toProcess.length)} of ${toProcess.length})`);

    await Promise.all(batch.map(async (k) => {
      try {
        const structured = await getReadingsStructured(k.kanji, k.readings, k.meanings);

        const { error: updateError } = await supabase
          .from('kanji_dictionary')
          .update({ readings_structured: structured })
          .eq('kanji', k.kanji);

        if (updateError) {
          console.error(`  ✗ ${k.kanji}: DB update failed:`, updateError.message);
          failed++;
        } else {
          console.log(`  ✓ ${k.kanji}: ${JSON.stringify(structured).slice(0, 80)}...`);
          success++;
        }
      } catch (err) {
        console.error(`  ✗ ${k.kanji}: API error:`, err.message);
        failed++;
      }
    }));

    // Delay between batches
    if (i + BATCH_SIZE < toProcess.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log(`\nDone! ✓ ${success} updated, ✗ ${failed} failed.`);
}

main();
