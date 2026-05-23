/**
 * Generate contextual English meanings using Claude API
 * For words that couldn't be fixed with dictionary pattern matching
 */

const fs = require('fs');
const path = require('path');

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

function buildCSVLine(fields) {
  return fields.map(field => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return '"' + field.replace(/"/g, '""') + '"';
    }
    return field;
  }).join(',');
}

async function callClaudeAPI(batch) {
  // Check if API key is set
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set. Please set it first:\nexport ANTHROPIC_API_KEY="your-key-here"');
  }

  const prompt = `You are a Japanese language learning expert. Generate concise, learner-friendly English meanings for Japanese words based on their context.

For each word below, provide ONLY the English meaning (3-8 words), nothing else.

Format your response as a JSON array of strings, one meaning per word in the same order.

Words to define:

${batch.map((item, i) => `${i + 1}. Word: ${item.word}
   Furigana: ${item.furigana || 'none'}
   Japanese sentence: ${item.japanese}
   English translation: ${item.english}
   Current meaning: ${item.currentMeaning || 'none'}
`).join('\n')}

Respond with ONLY a JSON array of meanings:
["meaning1", "meaning2", "meaning3", ...]`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Parse JSON response
  try {
    const meanings = JSON.parse(content);
    if (!Array.isArray(meanings)) {
      throw new Error('Response is not an array');
    }
    return meanings;
  } catch (e) {
    console.error('Failed to parse Claude response:', content);
    throw new Error('Failed to parse Claude response as JSON');
  }
}

async function generateMeanings() {
  console.log('🤖 Generating contextual meanings with Claude API...\n');

  // Load words that need AI
  const needsAIPath1 = path.join(__dirname, '..', 'words-still-need-ai.json');
  const needsAIPath2 = path.join(__dirname, '..', 'words-need-ai-meanings.json');

  let wordsNeedingAI = [];

  if (fs.existsSync(needsAIPath1)) {
    const data1 = JSON.parse(fs.readFileSync(needsAIPath1, 'utf-8'));
    wordsNeedingAI = wordsNeedingAI.concat(data1);
  }

  if (fs.existsSync(needsAIPath2)) {
    const data2 = JSON.parse(fs.readFileSync(needsAIPath2, 'utf-8'));
    wordsNeedingAI = wordsNeedingAI.concat(data2);
  }

  // Deduplicate by word+japanese combo
  const seen = new Set();
  const uniqueWords = [];
  for (const item of wordsNeedingAI) {
    const key = `${item.word}|${item.japanese}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueWords.push(item);
    }
  }

  console.log(`Found ${uniqueWords.length} unique words needing AI meanings\n`);

  if (uniqueWords.length === 0) {
    console.log('No words need AI processing!');
    return;
  }

  // Create a map for quick lookup
  const meaningMap = new Map();

  // Process in batches of 10
  const batchSize = 10;
  const totalBatches = Math.ceil(uniqueWords.length / batchSize);

  console.log(`Processing in ${totalBatches} batches of ${batchSize}...\n`);

  for (let i = 0; i < uniqueWords.length; i += batchSize) {
    const batch = uniqueWords.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    try {
      console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} words)...`);

      const meanings = await callClaudeAPI(batch);

      // Store results
      batch.forEach((item, idx) => {
        if (meanings[idx]) {
          const key = `${item.word}|${item.japanese}`;
          meaningMap.set(key, meanings[idx]);
          console.log(`  ✓ ${item.word} → "${meanings[idx]}"`);
        }
      });

      // Rate limiting: wait 1 second between batches
      if (i + batchSize < uniqueWords.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`\n❌ Error in batch ${batchNum}:`, error.message);
      console.log('Continuing with next batch...\n');
    }
  }

  console.log(`\n✓ Generated ${meaningMap.size} meanings\n`);

  // Now update the CSV
  console.log('Updating CSV with AI-generated meanings...\n');

  const csvPath = path.join(__dirname, '..', 'entire_sentences_english_meanings.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const output = [lines[0]];
  let updatedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 4) {
        output.push(line);
        continue;
      }

      const japanese = parts[1];
      const wordsStr = parts[3];

      if (!wordsStr || wordsStr === '[]') {
        output.push(line);
        continue;
      }

      const words = JSON.parse(wordsStr);
      let modified = false;

      for (const word of words) {
        if (!word.word) continue;

        const key = `${word.word}|${japanese}`;
        if (meaningMap.has(key)) {
          word.meaning = meaningMap.get(key);
          modified = true;
          updatedCount++;
        }
      }

      if (modified) {
        parts[3] = JSON.stringify(words);
        output.push(buildCSVLine(parts));
      } else {
        output.push(line);
      }

    } catch (e) {
      console.error(`Error updating line ${i}:`, e.message);
      output.push(line);
    }
  }

  // Write final output
  const outputPath = path.join(__dirname, '..', 'entire_sentences_final_with_ai_meanings.csv');
  fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');

  console.log('='.repeat(70));
  console.log('✓ AI MEANING GENERATION COMPLETE!');
  console.log('='.repeat(70));
  console.log(`\nGenerated meanings: ${meaningMap.size}`);
  console.log(`Updated word entries: ${updatedCount}`);
  console.log(`\nOutput: entire_sentences_final_with_ai_meanings.csv`);
  console.log('='.repeat(70));
}

if (require.main === module) {
  generateMeanings().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { generateMeanings };
