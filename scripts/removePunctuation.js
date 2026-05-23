require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

// Regex to match punctuation
const PUNCTUATION_REGEX = /^[。、！？.,!?…・]+$/;

async function removePunctuation() {
  console.log('🧹 Removing punctuation from word breakdowns...\n');

  const { data: sentences, error } = await supabase
    .from('sentences')
    .select('id, japanese, words')
    .limit(2000);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`📚 Checking ${sentences.length} sentences...\n`);

  let updated = 0;
  let totalPunctuationRemoved = 0;

  for (const sentence of sentences) {
    if (!sentence.words || sentence.words.length === 0) continue;

    // Filter out punctuation words
    const originalLength = sentence.words.length;
    const cleanedWords = sentence.words.filter(w => {
      return !PUNCTUATION_REGEX.test(w.word);
    });

    const removedCount = originalLength - cleanedWords.length;

    if (removedCount > 0) {
      // Update the sentence
      const { error: updateError } = await supabase
        .from('sentences')
        .update({ words: cleanedWords })
        .eq('id', sentence.id);

      if (updateError) {
        console.error(`❌ Error updating ${sentence.id}:`, updateError.message);
      } else {
        console.log(`✅ ${sentence.japanese}`);
        console.log(`   Removed ${removedCount} punctuation mark(s)`);
        updated++;
        totalPunctuationRemoved += removedCount;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  console.log('\n\n🎉 Cleanup complete!');
  console.log(`✅ Updated ${updated} sentences`);
  console.log(`🗑️  Removed ${totalPunctuationRemoved} punctuation marks total`);
}

removePunctuation().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
