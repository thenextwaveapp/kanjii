#!/usr/bin/env node

/**
 * Find sentences matching criteria
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findSentences(domainPattern, level) {
  console.log(`🔍 Searching for sentences...`);
  console.log(`   Domain pattern: ${domainPattern || 'Any'}`);
  console.log(`   Level: ${level || 'Any'}\n`);

  let query = supabase
    .from('sentences')
    .select('id, japanese, domain, jlpt_level')
    .order('domain');

  if (domainPattern && domainPattern !== 'Any') {
    query = query.or(`domain.eq.${domainPattern},domain.like.${domainPattern}:%`);
  }
  if (level && level !== 'Mixed') {
    query = query.eq('jlpt_level', level);
  }

  const { data: sentences, error } = await query;

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!sentences || sentences.length === 0) {
    console.log('❌ No sentences found\n');

    // Show available domains
    console.log('Available domains in your database:');
    const { data: allSentences } = await supabase
      .from('sentences')
      .select('domain, jlpt_level')
      .order('domain');

    if (allSentences) {
      const domainCounts = {};
      allSentences.forEach(s => {
        const key = `${s.domain} (${s.jlpt_level || 'no level'})`;
        domainCounts[key] = (domainCounts[key] || 0) + 1;
      });

      Object.entries(domainCounts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([domain, count]) => {
          console.log(`  - ${domain}: ${count} sentences`);
        });
    }
    return;
  }

  console.log(`✅ Found ${sentences.length} sentences:\n`);
  sentences.forEach((s, i) => {
    console.log(`${i + 1}. ${s.japanese}`);
    console.log(`   Domain: ${s.domain}`);
    console.log(`   Level: ${s.jlpt_level || 'no level'}`);
    console.log(`   ID: ${s.id}\n`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  let domainPattern = null;
  let level = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--domain' && args[i + 1]) {
      domainPattern = args[i + 1];
      i++;
    } else if (args[i] === '--level' && args[i + 1]) {
      level = args[i + 1];
      i++;
    }
  }

  await findSentences(domainPattern, level);
}

main().catch(console.error);
