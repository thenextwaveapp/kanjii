require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const ws = require('ws');
const fs = require('fs');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
});

async function regenerateWordBreakdowns() {
  console.log('🔧 Regenerating word breakdowns for sentences with bad meanings...\n');

  // Load the bad sentences
  const badSentences = JSON.parse(fs.readFileSync('./bad-meanings-report.json', 'utf8'));

  console.log(`📚 Processing ${badSentences.length} sentences...\n`);

  let fixed = 0;
  let errors = 0;

  for (const sentence of badSentences) {
    try {
      console.log(`\n📝 ${sentence.japanese}`);
      console.log(`   (${sentence.english})`);

      const prompt = `Given this Japanese sentence and its English translation, provide a word breakdown.

Japanese: ${sentence.japanese}
English: ${sentence.english}

Return ONLY a valid JSON array of objects with this exact format:
[
  {"word": "日本語", "furigana": "にほんご", "meaning": "Japanese language"},
  {"word": "を", "furigana": "を", "meaning": "object marker"}
]

Rules:
- Break the sentence into meaningful words (not individual characters)
- For particles, use their grammatical function as meaning (e.g., "を" = "object marker")
- For content words (nouns, verbs, adjectives), provide the English meaning
- Furigana must be in hiragana only (no kanji, no katakana for Japanese words)
- Katakana words can have katakana furigana
- Return ONLY the JSON array, no explanation`;

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = message.content[0].text.trim();

      // Extract JSON from response (in case there's any wrapper text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const words = JSON.parse(jsonMatch[0]);

      console.log(`   Generated ${words.length} words:`);
      words.forEach(w => {
        console.log(`     ${w.word} (${w.furigana}) = ${w.meaning}`);
      });

      // Update in database
      const { error: updateError } = await supabase
        .from('sentences')
        .update({ words })
        .eq('id', sentence.id);

      if (updateError) {
        console.error(`   ❌ Error updating database:`, updateError.message);
        errors++;
      } else {
        console.log(`   ✅ Updated successfully`);
        fixed++;
      }

      // Delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      console.error(`   ❌ Error:`, err.message);
      errors++;
    }
  }

  console.log('\n\n🎉 Regeneration complete!');
  console.log(`✅ Fixed: ${fixed} sentences`);
  console.log(`❌ Errors: ${errors} sentences`);
}

regenerateWordBreakdowns().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
