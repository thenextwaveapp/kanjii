/**
 * Comprehensive cleanup: Keep particles with meanings, fix furigana, add contextual meanings
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

function hasJapanese(text) {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

// Particle meanings
const PARTICLE_MEANINGS = {
  'が': 'subject marker',
  'を': 'object marker',
  'に': 'target/direction particle',
  'へ': 'direction particle',
  'で': 'location/means particle',
  'から': 'from/since',
  'まで': 'until/to',
  'より': 'than/from',
  'は': 'topic marker',
  'も': 'also/too',
  'こそ': 'emphasis particle',
  'さえ': 'even',
  'でも': 'even/but',
  'しか': 'only (with negative)',
  'だけ': 'only/just',
  'ばかり': 'only/just',
  'ほど': 'extent/about',
  'くらい': 'approximately',
  'ぐらい': 'approximately',
  'と': 'and/with/quotation',
  'や': 'and (non-exhaustive)',
  'か': 'or/question',
  'の': 'possessive/explanatory',
  'し': 'and (listing reasons)',
  'たり': 'actions in sequence',
  'ね': 'confirmatory particle',
  'よ': 'emphasis/assertion',
  'よね': 'seeking agreement',
  'な': 'prohibitive/emotive',
  'ぞ': 'masculine emphasis',
  'ぜ': 'masculine assertion',
  'わ': 'feminine emphasis',
  'かな': 'wondering',
  'っけ': 'recall/confirmation',
  'って': 'quotation/hearsay',
  'なんて': 'such as/like',
  'など': 'et cetera',
};

// Auxiliaries and copulas
const AUXILIARY_MEANINGS = {
  'です': 'polite copula',
  'だ': 'plain copula',
  'である': 'formal copula',
  'ます': 'polite verb ending',
  'まし': 'polite past stem',
  'ませ': 'polite negative stem',
  'た': 'past tense',
  'て': 'te-form connector',
  'で': 'te-form of だ',
  'ている': 'ongoing action',
  'てる': 'ongoing (casual)',
  'ていた': 'was doing',
  'てた': 'was doing (casual)',
  'ない': 'negative',
  'ぬ': 'negative (classical)',
  'ん': 'negative (casual)',
  'られる': 'passive/potential',
  'れる': 'passive/potential',
  'せる': 'causative',
  'させる': 'causative',
  'たい': 'want to',
  'そう': 'seems/looks like',
  'らしい': 'seems/apparently',
  'ようだ': 'seems like',
  'みたい': 'like/似',
};

// Demonstratives and other common words
const COMMON_MEANINGS = {
  'この': 'this',
  'その': 'that',
  'あの': 'that over there',
  'どの': 'which',
  'こう': 'like this',
  'そう': 'like that',
  'ああ': 'like that',
  'どう': 'how',
  'ここ': 'here',
  'そこ': 'there',
  'あそこ': 'over there',
  'どこ': 'where',
  'こちら': 'this way/here',
  'そちら': 'that way/there',
  'あちら': 'that way/over there',
  'どちら': 'which way/where',
};

async function comprehensiveCleanup() {
  console.log('🔧 Comprehensive cleanup with particles...\n');

  // Load jpdb
  console.log('Loading jpdb...');
  const { loadJpdb } = require('./loadJpdb');
  const jpdb = await loadJpdb();
  console.log(`Loaded ${jpdb.size} jpdb entries\n`);

  // Load AI meanings (from both files)
  console.log('Loading AI-generated meanings...');
  const aiMeanings1 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'ai-generated-meanings.json'), 'utf-8'));
  const aiMeanings2 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'remaining-ai-meanings.json'), 'utf-8'));
  const aiMeanings = { ...aiMeanings1, ...aiMeanings2 };
  console.log(`Loaded ${Object.keys(aiMeanings).length} AI meanings\n`);

  // Load JMdict
  console.log('Loading JMdict...');
  const jmdict = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'jmdict-subset.json'), 'utf-8'));
  console.log(`Loaded ${Object.keys(jmdict).length} JMdict entries\n`);

  // Read original CSV
  const csvPath = path.join(__dirname, '..', 'entire_sentences.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const output = [lines[0]];

  const stats = {
    totalWords: 0,
    particleMeaningsAdded: 0,
    furiganaFixed: 0,
    aiMeaningsApplied: 0,
    jmdictMeaningsApplied: 0,
  };

  console.log('Processing sentences...\n');

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
      const english = parts[2];
      const wordsStr = parts[3];

      if (!wordsStr || wordsStr === '[]') {
        output.push(line);
        continue;
      }

      const words = JSON.parse(wordsStr);
      let modified = false;

      // Filter out punctuation
      const filteredWords = words.filter(word => {
        if (!word.word) return false;
        // Remove pure punctuation
        if (/^[。、！？・…「」『』（）\s]+$/.test(word.word)) return false;
        return true;
      });

      for (const word of filteredWords) {
        stats.totalWords++;

        // 1. Fix furigana from jpdb
        if (jpdb.has(word.word)) {
          const jpdbEntry = jpdb.get(word.word);
          if (jpdbEntry.reading && word.furigana !== jpdbEntry.reading) {
            word.furigana = jpdbEntry.reading;
            modified = true;
            stats.furiganaFixed++;
          }
        }

        // 2. Add particle meanings
        if (PARTICLE_MEANINGS[word.word]) {
          const currentMeaning = (word.meaning || '').trim();
          if (!currentMeaning || hasJapanese(currentMeaning) || currentMeaning === word.word) {
            word.meaning = PARTICLE_MEANINGS[word.word];
            modified = true;
            stats.particleMeaningsAdded++;
          }
        }
        // 3. Add auxiliary meanings
        else if (AUXILIARY_MEANINGS[word.word]) {
          const currentMeaning = (word.meaning || '').trim();
          if (!currentMeaning || hasJapanese(currentMeaning) || currentMeaning === word.word) {
            word.meaning = AUXILIARY_MEANINGS[word.word];
            modified = true;
            stats.particleMeaningsAdded++;
          }
        }
        // 4. Add common word meanings (demonstratives, etc.)
        else if (COMMON_MEANINGS[word.word]) {
          const currentMeaning = (word.meaning || '').trim();
          if (!currentMeaning || hasJapanese(currentMeaning) || currentMeaning === word.word) {
            word.meaning = COMMON_MEANINGS[word.word];
            modified = true;
            stats.particleMeaningsAdded++;
          }
        }
        // 5. Apply AI meanings (for specific contexts)
        else {
          const key = `${word.word}|${japanese}`;
          if (aiMeanings[key]) {
            word.meaning = aiMeanings[key];
            modified = true;
            stats.aiMeaningsApplied++;
          }
          // 6. Apply JMdict if meaning is Japanese
          else {
            const currentMeaning = (word.meaning || '').trim();
            if (hasJapanese(currentMeaning) || !currentMeaning) {
              if (jmdict[word.word]) {
                // Use first meaning from dictionary
                const meanings = jmdict[word.word].split(',');
                word.meaning = meanings[0].trim();
                modified = true;
                stats.jmdictMeaningsApplied++;
              }
            }
          }
        }
      }

      // Always update if we filtered punctuation OR modified meanings
      if (filteredWords.length !== words.length || modified) {
        parts[3] = JSON.stringify(filteredWords);
        output.push(buildCSVLine(parts));
      } else {
        output.push(line);
      }

    } catch (e) {
      console.error(`Error processing line ${i}:`, e.message);
      output.push(line);
    }
  }

  // Write output
  const outputPath = path.join(__dirname, '..', 'entire_sentences_complete.csv');
  fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');

  console.log('='.repeat(70));
  console.log('✓ COMPREHENSIVE CLEANUP COMPLETE');
  console.log('='.repeat(70));
  console.log(`\nTotal words: ${stats.totalWords}`);
  console.log(`Particle/auxiliary meanings added: ${stats.particleMeaningsAdded}`);
  console.log(`Furigana fixed (jpdb): ${stats.furiganaFixed}`);
  console.log(`AI contextual meanings: ${stats.aiMeaningsApplied}`);
  console.log(`JMdict meanings: ${stats.jmdictMeaningsApplied}`);
  console.log(`\nOutput: entire_sentences_complete.csv`);
  console.log('='.repeat(70));
}

if (require.main === module) {
  comprehensiveCleanup().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { comprehensiveCleanup };
