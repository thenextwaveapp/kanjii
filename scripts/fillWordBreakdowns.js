require('dotenv').config();

const kuromoji = require('kuromoji');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

// Initialize Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: WebSocket,
  },
});

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
  console.log('🚀 Starting word breakdown filler...\n');

  // Initialize Kuromoji tokenizer
  const tokenizer = await new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, tokenizer) => {
      if (err) reject(err);
      else resolve(tokenizer);
    });
  });
  console.log('✅ Kuromoji initialized\n');

  // Fetch all sentences and filter in code
  const { data: allSentences, error } = await supabase
    .from('sentences')
    .select('id, japanese, english, words')
    .limit(500); // Fetch more, filter in code

  if (error) {
    console.error('❌ Error fetching sentences:', error);
    return;
  }

  // Filter for incomplete sentences in JavaScript
  const sentences = allSentences.filter(s => {
    if (!s.words || s.words.length === 0) return true;
    if (s.japanese.length > 10 && s.words.length < 3) return true;
    return false;
  }).slice(0, 100); // Process first 100

  console.log(`📝 Found ${sentences.length} sentences to process\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const sentence of sentences) {
    try {
      console.log(`Processing: ${sentence.japanese}`);

      // Tokenize the Japanese text
      const tokens = tokenizer.tokenize(sentence.japanese);

      // Build word array
      const words = tokens
        .filter(token => token.surface_form && token.surface_form.trim() !== '')
        .map(token => {
          const word = token.surface_form;
          const reading = token.reading || word;

          // Convert katakana reading to hiragana for furigana
          const furigana = katakanaToHiragana(reading);

          // Try to get meaning from particle list or token info
          let meaning = PARTICLE_MEANINGS[word] || '';

          // Use part of speech for common grammatical elements
          if (!meaning && token.pos) {
            const pos = token.pos;
            if (pos === '助詞') meaning = 'particle';
            else if (pos === '助動詞') meaning = 'auxiliary verb';
            else if (pos === '動詞') meaning = 'verb';
            else if (pos === '名詞') meaning = 'noun';
            else if (pos === '形容詞') meaning = 'adjective';
            else if (pos === '副詞') meaning = 'adverb';
            else if (pos === '接続詞') meaning = 'conjunction';
            else if (pos === '感動詞') meaning = 'interjection';
          }

          return {
            word,
            furigana,
            meaning: meaning || '', // Leave empty if unknown
          };
        });

      // Update the sentence in database
      const { error: updateError } = await supabase
        .from('sentences')
        .update({ words })
        .eq('id', sentence.id);

      if (updateError) {
        console.error(`  ❌ Error updating: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`  ✅ Updated with ${words.length} words`);
        successCount++;
      }

    } catch (err) {
      console.error(`  ❌ Error processing: ${err.message}`);
      errorCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Results:`);
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`\n✨ Done!`);
}

main().catch(console.error);
