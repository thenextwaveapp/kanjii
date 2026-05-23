require('dotenv').config();

const kuromoji = require('kuromoji');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const fs = require('fs');

// Initialize Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: WebSocket,
  },
});

// Load the report to get the list of sentences with issues
const report = JSON.parse(fs.readFileSync('./missing-furigana-report.json', 'utf8'));
const sentencesWithIssues = [...new Set(report.issues.map(i => i.id))];

console.log(`🔧 Fixing ${sentencesWithIssues.length} sentences with missing furigana\n`);

// Particle and common word meanings
const PARTICLE_MEANINGS = {
  'は': 'topic marker',
  'が': 'subject marker',
  'を': 'object marker',
  'に': 'to/at/in',
  'へ': 'to/towards',
  'で': 'at/by/with',
  'と': 'and/with',
  'から': 'from',
  'まで': 'until',
  'の': 'possessive',
  'も': 'also/too',
  'や': 'and (non-exhaustive)',
  'か': 'question marker',
  'ね': 'confirmation/agreement',
  'よ': 'emphasis',
  'な': 'casual prohibition',
  'さ': 'casual emphasis',
  'わ': 'feminine emphasis',
  'ぞ': 'masculine emphasis',
  'ぜ': 'masculine emphasis',
};

// Convert katakana to hiragana
function katakanaToHiragana(str) {
  return str.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 0x30A1 && code <= 0x30F6) {
      return String.fromCharCode(code - 0x60);
    }
    return char;
  }).join('');
}

async function main() {
  console.log('🚀 Starting furigana fixer...\n');

  // Initialize Kuromoji tokenizer
  const tokenizer = await new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, tokenizer) => {
      if (err) reject(err);
      else resolve(tokenizer);
    });
  });
  console.log('✅ Kuromoji initialized\n');

  // Fetch the problematic sentences
  const { data: sentences, error } = await supabase
    .from('sentences')
    .select('id, japanese, english, words')
    .in('id', sentencesWithIssues);

  if (error) {
    console.error('❌ Error fetching sentences:', error);
    return;
  }

  console.log(`📚 Processing ${sentences.length} sentences...\n`);

  let fixed = 0;
  let errors = 0;

  for (const sentence of sentences) {
    try {
      console.log(`\n📝 Fixing: ${sentence.japanese}`);

      // Tokenize the sentence
      const tokens = tokenizer.tokenize(sentence.japanese);

      // Build word array with furigana
      const words = [];

      for (const token of tokens) {
        const surface = token.surface_form;
        const reading = token.reading || surface;
        const pos = token.pos;

        // Convert katakana reading to hiragana
        const furigana = katakanaToHiragana(reading);

        // Get meaning
        let meaning = '';

        // Check if it's a particle
        if (PARTICLE_MEANINGS[surface]) {
          meaning = PARTICLE_MEANINGS[surface];
        } else {
          // Use the basic form or surface form for meaning lookup
          // In a production system, you'd look this up in a dictionary
          // For now, we'll leave it empty and let it be filled later
          meaning = token.basic_form || surface;
        }

        words.push({
          word: surface,
          furigana: furigana,
          meaning: meaning
        });
      }

      // Update the sentence in the database
      const { error: updateError } = await supabase
        .from('sentences')
        .update({ words })
        .eq('id', sentence.id);

      if (updateError) {
        console.error(`❌ Error updating sentence ${sentence.id}:`, updateError.message);
        errors++;
      } else {
        console.log(`✅ Fixed: ${sentence.japanese}`);
        console.log(`   Words: ${words.map(w => `${w.word}(${w.furigana})`).join(' ')}`);
        fixed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.error(`❌ Error processing sentence ${sentence.id}:`, err.message);
      errors++;
    }
  }

  console.log('\n\n🎉 Fixing complete!');
  console.log(`✅ Successfully fixed: ${fixed} sentences`);
  if (errors > 0) {
    console.log(`❌ Errors: ${errors} sentences`);
  }

  console.log('\n💡 Note: You may need to manually add English meanings for some words.');
  console.log('   Run the findMissingFurigana.js script again to verify the fixes.');
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
