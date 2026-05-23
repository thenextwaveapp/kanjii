/**
 * Analyze the words array to identify quality issues
 * Generates a report without modifying data
 */

const fs = require('fs');
const path = require('path');
const { loadJpdb } = require('./loadJpdb');
const { isLikelyParticle, isPunctuation, hasBadMeaning } = require('./filterBadWords');

function parseCSVLine(line) {
  // Simple CSV parser that handles quoted fields with escaped quotes
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
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // End of quoted field
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current); // Add last field

  return fields;
}

function analyzeWords() {
  console.log('Loading jpdb database...');
  const jpdb = loadJpdb();

  const csvPath = path.join(__dirname, '..', 'entire_sentences.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const stats = {
    totalSentences: 0,
    sentencesWithWords: 0,
    totalWords: 0,
    particles: 0,
    punctuation: 0,
    badMeanings: 0,
    wrongFurigana: 0,
    notInJpdb: 0,
    tooFewWords: 0,  // < 2 words
    tooManyWords: 0, // > 8 words
    goodWords: 0,
    wordCountDistribution: {},
  };

  const issues = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    stats.totalSentences++;

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 4) continue;

      // Extract fields: id, japanese, english, words, ...
      const id = parts[0];
      const japanese = parts[1];
      const wordsStr = parts[3];

      if (!wordsStr || wordsStr === '[]') continue;

      const words = JSON.parse(wordsStr);
      stats.sentencesWithWords++;
      stats.totalWords += words.length;

      // Track word count distribution
      const count = words.length;
      stats.wordCountDistribution[count] = (stats.wordCountDistribution[count] || 0) + 1;

      if (count < 2) stats.tooFewWords++;
      if (count > 8) stats.tooManyWords++;

      const sentenceIssues = [];

      for (const word of words) {
        if (!word.word) continue;

        // Check for particles
        if (isLikelyParticle(word.word)) {
          stats.particles++;
          sentenceIssues.push(`Particle: ${word.word}`);
          continue;
        }

        // Check for punctuation
        if (isPunctuation(word.word)) {
          stats.punctuation++;
          sentenceIssues.push(`Punctuation: ${word.word}`);
          continue;
        }

        // Check for bad meanings
        if (hasBadMeaning(word.meaning)) {
          stats.badMeanings++;
          sentenceIssues.push(`Bad meaning: ${word.word} = "${word.meaning}"`);
        }

        // Check furigana against jpdb
        const jpdbEntry = jpdb.get(word.word);
        if (jpdbEntry) {
          if (word.furigana !== jpdbEntry.reading) {
            stats.wrongFurigana++;
            sentenceIssues.push(
              `Wrong furigana: ${word.word} has "${word.furigana}" should be "${jpdbEntry.reading}"`
            );
          } else {
            stats.goodWords++;
          }
        } else {
          stats.notInJpdb++;
          sentenceIssues.push(`Not in jpdb: ${word.word}`);
        }
      }

      if (sentenceIssues.length > 0) {
        issues.push({
          id,
          japanese,
          wordCount: count,
          issues: sentenceIssues,
        });
      }

    } catch (e) {
      console.error(`Error processing line ${i}:`, e.message);
    }
  }

  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('WORDS ARRAY QUALITY REPORT');
  console.log('='.repeat(60));
  console.log(`\nTotal sentences: ${stats.totalSentences}`);
  console.log(`Sentences with words: ${stats.sentencesWithWords}`);
  console.log(`Total words: ${stats.totalWords}`);
  console.log(`Average words per sentence: ${(stats.totalWords / stats.sentencesWithWords).toFixed(1)}`);

  console.log(`\n${'ISSUES FOUND'.padEnd(40)} ${'COUNT'.padStart(10)}`);
  console.log('-'.repeat(60));
  console.log(`${'Particles (should be removed)'.padEnd(40)} ${stats.particles.toString().padStart(10)}`);
  console.log(`${'Punctuation (should be removed)'.padEnd(40)} ${stats.punctuation.toString().padStart(10)}`);
  console.log(`${'Bad/generic meanings'.padEnd(40)} ${stats.badMeanings.toString().padStart(10)}`);
  console.log(`${'Wrong furigana'.padEnd(40)} ${stats.wrongFurigana.toString().padStart(10)}`);
  console.log(`${'Words not in jpdb'.padEnd(40)} ${stats.notInJpdb.toString().padStart(10)}`);
  console.log(`${'Sentences with < 2 words'.padEnd(40)} ${stats.tooFewWords.toString().padStart(10)}`);
  console.log(`${'Sentences with > 8 words'.padEnd(40)} ${stats.tooManyWords.toString().padStart(10)}`);
  console.log(`${'Good words (no issues)'.padEnd(40)} ${stats.goodWords.toString().padStart(10)}`);

  console.log(`\nWORD COUNT DISTRIBUTION:`);
  const sortedCounts = Object.keys(stats.wordCountDistribution)
    .map(Number)
    .sort((a, b) => a - b);

  for (const count of sortedCounts) {
    const barLength = Math.floor(stats.wordCountDistribution[count] / 10);
    const bar = '█'.repeat(barLength);
    console.log(`  ${count.toString().padStart(2)} words: ${stats.wordCountDistribution[count].toString().padStart(4)} ${bar}`);
  }

  // Write detailed issues report
  const reportPath = path.join(__dirname, '..', 'words-quality-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2), 'utf-8');

  console.log(`\n✓ Analysis complete!`);
  console.log(`  - Detailed issues written to words-quality-report.json`);
  console.log(`  - Total issues found in ${issues.length} sentences`);
}

if (require.main === module) {
  analyzeWords();
}

module.exports = { analyzeWords };
