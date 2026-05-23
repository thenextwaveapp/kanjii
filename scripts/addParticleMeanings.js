/**
 * Add proper grammatical meanings to particles
 * Keep particles in the data but ensure they have helpful explanations
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

// Comprehensive particle meanings
const PARTICLE_MEANINGS = {
  // Case particles
  'が': 'subject marker',
  'を': 'object marker',
  'に': 'target/direction particle',
  'へ': 'direction particle',
  'で': 'location/means particle',
  'から': 'from/since',
  'まで': 'until/to',
  'より': 'than/from',

  // Topic/emphasis particles
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

  // Connective particles
  'と': 'and/with/quotation',
  'や': 'and (non-exhaustive)',
  'か': 'or/question',
  'の': 'possessive/explanatory',
  'し': 'and (listing reasons)',
  'たり': 'actions in sequence',

  // Sentence-ending particles
  'ね': 'confirmatory particle',
  'よ': 'emphasis/assertion',
  'よね': 'seeking agreement',
  'な': 'prohibitive/emotive',
  'ぞ': 'masculine emphasis',
  'ぜ': 'masculine assertion',
  'わ': 'feminine emphasis',
  'の': 'explanatory/feminine',
  'かな': 'wondering',
  'っけ': 'recall/confirmation',

  // Auxiliary particles
  'って': 'quotation/hearsay',
  'なんて': 'such as/like',
  'など': 'et cetera',
  'ほか': 'besides/other than',
  'ずつ': 'each/apiece',
  'ごとに': 'every',
  'につき': 'per/due to',
  'について': 'about/regarding',
  'にとって': 'for/to',
  'によって': 'by/depending on',
  'において': 'in/at (formal)',
  'に対して': 'toward/against',
  'に関して': 'regarding',
  'として': 'as',
  'とともに': 'together with',
  'をめぐって': 'concerning',
  'をもって': 'with/by means of',
  'にわたって': 'over/throughout',
  'にかけて': 'over/spanning',
  'を通して': 'through',
  'によると': 'according to',
  'にしたがって': 'according to/as',
  'に伴って': 'along with',
  'に際して': 'on the occasion of',
  'を問わず': 'regardless of',
  'にもかかわらず': 'despite',
  'に反して': 'contrary to',
};

function getParticleMeaning(word) {
  return PARTICLE_MEANINGS[word] || null;
}

function processWithParticles() {
  console.log('🔧 Adding grammatical meanings to particles...\n');

  // Start from original data
  const csvPath = path.join(__dirname, '..', 'entire_sentences.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const output = [lines[0]];

  const stats = {
    totalWords: 0,
    particlesFound: 0,
    particlesMeaningAdded: 0,
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 4) {
        output.push(line);
        continue;
      }

      const wordsStr = parts[3];
      if (!wordsStr || wordsStr === '[]') {
        output.push(line);
        continue;
      }

      const words = JSON.parse(wordsStr);
      let modified = false;

      for (const word of words) {
        if (!word.word) continue;

        stats.totalWords++;

        // Check if it's a particle
        const particleMeaning = getParticleMeaning(word.word);
        if (particleMeaning) {
          stats.particlesFound++;

          // Add or update meaning
          const currentMeaning = (word.meaning || '').trim();
          if (!currentMeaning || currentMeaning === word.word) {
            word.meaning = particleMeaning;
            modified = true;
            stats.particlesMeaningAdded++;
          }
        }
      }

      if (modified) {
        parts[3] = JSON.stringify(words);
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
  const outputPath = path.join(__dirname, '..', 'entire_sentences_with_particles.csv');
  fs.writeFileSync(outputPath, output.join('\n'), 'utf-8');

  console.log('='.repeat(70));
  console.log('✓ PARTICLE MEANINGS ADDED');
  console.log('='.repeat(70));
  console.log(`\nTotal words processed: ${stats.totalWords}`);
  console.log(`Particles found: ${stats.particlesFound}`);
  console.log(`Particle meanings added: ${stats.particlesMeaningAdded}`);
  console.log(`\nOutput: entire_sentences_with_particles.csv`);
  console.log('='.repeat(70));
}

if (require.main === module) {
  processWithParticles();
}

module.exports = { processWithParticles };
