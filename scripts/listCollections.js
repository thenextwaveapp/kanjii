#!/usr/bin/env node

/**
 * Lists all collections and their lessons with sentence counts
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listCollections() {
  console.log('📚 Collections\n');

  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .order('order_index');

  if (!collections || collections.length === 0) {
    console.log('No collections found');
    return;
  }

  for (const collection of collections) {
    console.log(`${collection.emoji}  ${collection.name}`);
    console.log(`   ${collection.description}`);
    console.log(`   Level: ${collection.level || 'Mixed'}\n`);

    // Get lessons for this collection
    const { data: lessons } = await supabase
      .from('lessons')
      .select(`
        id,
        name,
        description,
        order_index
      `)
      .eq('collection_id', collection.id)
      .order('order_index');

    if (lessons && lessons.length > 0) {
      for (const lesson of lessons) {
        // Count sentences in this lesson
        const { count } = await supabase
          .from('lesson_sentences')
          .select('*', { count: 'exact', head: true })
          .eq('lesson_id', lesson.id);

        const sentenceCount = count || 0;
        const status = sentenceCount > 0 ? '✓' : '○';

        console.log(`   ${status} Lesson ${lesson.order_index}: ${lesson.name}`);
        console.log(`      ${lesson.description || 'No description'}`);
        console.log(`      ${sentenceCount} sentence${sentenceCount !== 1 ? 's' : ''}`);
      }
      console.log('');
    } else {
      console.log('   (No lessons yet)\n');
    }
  }
}

listCollections().catch(console.error);
