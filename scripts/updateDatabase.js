#!/usr/bin/env node

/**
 * Update Supabase database with cleaned sentence data
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: {
    transport: WebSocket
  }
});

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

async function updateDatabase() {
  console.log('🔄 Updating Supabase database with cleaned data...\n');

  // Read cleaned CSV (with particles)
  const csvPath = path.join(__dirname, '..', 'entire_sentences_complete.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const stats = {
    total: 0,
    updated: 0,
    notFound: 0,
    errors: 0,
  };

  console.log(`Processing ${lines.length - 1} sentences...\n`);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 4) continue;

      const id = parts[0];
      const japanese = parts[1];
      const english = parts[2];
      const wordsStr = parts[3];

      stats.total++;

      // Parse words - keep furigana field as-is (app expects it)
      const words = JSON.parse(wordsStr);
      const dbWords = words.map(word => ({
        word: word.word,
        furigana: word.furigana || word.reading || '',
        meaning: word.meaning || '',
      }));

      // Update in Supabase - match by Japanese text
      const { data, error } = await supabase
        .from('sentences')
        .update({
          words: dbWords,
          english: english,
        })
        .eq('japanese', japanese)
        .select();

      if (error) {
        console.error(`  ✗ Error updating sentence ${i}: ${error.message}`);
        stats.errors++;
      } else if (!data || data.length === 0) {
        stats.notFound++;
        if (stats.notFound <= 5) {
          console.log(`  ⚠️  Not found in DB: ${japanese.substring(0, 40)}...`);
        }
      } else {
        stats.updated++;
        if (stats.updated % 100 === 0) {
          console.log(`  ✓ Updated ${stats.updated}/${stats.total} sentences...`);
        }
      }

    } catch (e) {
      console.error(`  ✗ Error processing line ${i}:`, e.message);
      stats.errors++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('DATABASE UPDATE COMPLETE');
  console.log('='.repeat(70));
  console.log(`\nTotal processed: ${stats.total}`);
  console.log(`Successfully updated: ${stats.updated}`);
  console.log(`Not found in DB: ${stats.notFound}`);
  console.log(`Errors: ${stats.errors}`);
  console.log('='.repeat(70));

  if (stats.notFound > 0) {
    console.log(`\n⚠️  ${stats.notFound} sentences from CSV not found in database.`);
    console.log('These may be from a different dataset or already deleted.');
  }

  if (stats.updated > 0) {
    console.log('\n✨ Database updated successfully!');
    console.log('The app will now show cleaned word breakdowns.');
  }
}

updateDatabase().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
