/**
 * Compare data quality before and after cleanup
 */

const fs = require('fs');
const path = require('path');
const { loadJpdb } = require('./loadJpdb');
const { isLikelyParticle, isPunctuation, hasBadMeaning } = require('./filterBadWords');

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

function analyzeFile(filePath, jpdb) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const stats = {
    totalSentences: 0,
    totalWords: 0,
    particles: 0,
    punctuation: 0,
    badMeanings: 0,
    wrongFurigana: 0,
    notInJpdb: 0,
    goodWords: 0,
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    stats.totalSentences++;

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 4) continue;

      const wordsStr = parts[3];
      if (!wordsStr || wordsStr === '[]') continue;

      const words = JSON.parse(wordsStr);
      stats.totalWords += words.length;

      for (const word of words) {
        if (!word.word) continue;

        if (isLikelyParticle(word.word)) {
          stats.particles++;
          continue;
        }

        if (isPunctuation(word.word)) {
          stats.punctuation++;
          continue;
        }

        if (hasBadMeaning(word.meaning)) {
          stats.badMeanings++;
        }

        const jpdbEntry = jpdb.get(word.word);
        if (jpdbEntry) {
          if (word.furigana !== jpdbEntry.reading) {
            stats.wrongFurigana++;
          } else {
            stats.goodWords++;
          }
        } else {
          stats.notInJpdb++;
        }
      }
    } catch (e) {
      // Skip error lines
    }
  }

  return stats;
}

function compare() {
  console.log('Loading jpdb database...');
  const jpdb = loadJpdb();

  const beforePath = path.join(__dirname, '..', 'entire_sentences.csv');
  const afterPath = path.join(__dirname, '..', 'entire_sentences_cleaned.csv');

  console.log('\nAnalyzing before cleanup...');
  const before = analyzeFile(beforePath, jpdb);

  console.log('Analyzing after cleanup...');
  const after = analyzeFile(afterPath, jpdb);

  console.log('\n' + '='.repeat(70));
  console.log('BEFORE vs AFTER COMPARISON');
  console.log('='.repeat(70));

  const metrics = [
    { label: 'Total sentences', before: before.totalSentences, after: after.totalSentences },
    { label: 'Total words', before: before.totalWords, after: after.totalWords },
    { label: 'Avg words/sentence', before: (before.totalWords / before.totalSentences).toFixed(1), after: (after.totalWords / after.totalSentences).toFixed(1) },
    { label: '', before: '', after: '' }, // Spacer
    { label: 'Particles', before: before.particles, after: after.particles, bad: true },
    { label: 'Punctuation', before: before.punctuation, after: after.punctuation, bad: true },
    { label: 'Bad meanings', before: before.badMeanings, after: after.badMeanings, bad: true },
    { label: 'Wrong furigana', before: before.wrongFurigana, after: after.wrongFurigana, bad: true },
    { label: 'Not in jpdb', before: before.notInJpdb, after: after.notInJpdb },
    { label: '', before: '', after: '' }, // Spacer
    { label: 'Good words', before: before.goodWords, after: after.goodWords, good: true },
  ];

  console.log('\n' + 'METRIC'.padEnd(25) + 'BEFORE'.padStart(12) + 'AFTER'.padStart(12) + 'CHANGE'.padStart(15));
  console.log('-'.repeat(70));

  for (const metric of metrics) {
    if (!metric.label) {
      console.log('');
      continue;
    }

    const beforeVal = String(metric.before).padStart(12);
    const afterVal = String(metric.after).padStart(12);

    let change = '';
    if (typeof metric.before === 'number' && typeof metric.after === 'number') {
      const diff = metric.after - metric.before;
      const symbol = diff > 0 ? '+' : '';
      const color = metric.good
        ? (diff > 0 ? '✓' : '✗')
        : metric.bad
        ? (diff < 0 ? '✓' : '✗')
        : '';

      change = `${symbol}${diff} ${color}`.padStart(15);
    }

    console.log(metric.label.padEnd(25) + beforeVal + afterVal + change);
  }

  // Calculate quality scores
  const beforeQuality = (before.goodWords / before.totalWords * 100).toFixed(1);
  const afterQuality = (after.goodWords / after.totalWords * 100).toFixed(1);

  console.log('\n' + '='.repeat(70));
  console.log(`QUALITY SCORE (% good words): ${beforeQuality}% → ${afterQuality}% (+${(afterQuality - beforeQuality).toFixed(1)}%)`);
  console.log('='.repeat(70));
}

if (require.main === module) {
  compare();
}

module.exports = { compare };
