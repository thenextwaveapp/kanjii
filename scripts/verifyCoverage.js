/**
 * Verify that word breakdowns cover the entire Japanese text
 * No gaps, no partial words - everything should be accounted for
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

function removePunctuation(text) {
  // Remove common Japanese punctuation
  return text.replace(/[。、！？・…「」『』（）\s]/g, '');
}

function verifyCoverage() {
  console.log('🔍 Verifying word coverage of Japanese text...\n');

  const csvPath = path.join(__dirname, '..', 'entire_sentences_full_coverage.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  const stats = {
    totalSentences: 0,
    perfectCoverage: 0,
    partialCoverage: 0,
    noCoverage: 0,
    overCoverage: 0,
  };

  const issues = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    try {
      const parts = parseCSVLine(line);
      if (parts.length < 4) continue;

      const japanese = parts[1];
      const wordsStr = parts[3];

      stats.totalSentences++;

      if (!wordsStr || wordsStr === '[]') {
        stats.noCoverage++;
        if (issues.length < 20) {
          issues.push({
            type: 'no_coverage',
            japanese: japanese,
            issue: 'No words array',
          });
        }
        continue;
      }

      const words = JSON.parse(wordsStr);

      // Remove punctuation from original text
      const cleanJapanese = removePunctuation(japanese);

      // Concatenate all words
      const wordsText = words.map(w => w.word).join('');
      const cleanWordsText = removePunctuation(wordsText);

      // Compare
      if (cleanJapanese === cleanWordsText) {
        stats.perfectCoverage++;
      } else if (cleanJapanese.includes(cleanWordsText)) {
        stats.partialCoverage++;
        if (issues.length < 20) {
          issues.push({
            type: 'partial_coverage',
            japanese: japanese,
            cleanJapanese: cleanJapanese,
            wordsText: wordsText,
            cleanWordsText: cleanWordsText,
            missing: cleanJapanese.replace(cleanWordsText, '[MISSING]'),
          });
        }
      } else if (cleanWordsText.includes(cleanJapanese)) {
        stats.overCoverage++;
        if (issues.length < 20) {
          issues.push({
            type: 'over_coverage',
            japanese: japanese,
            cleanJapanese: cleanJapanese,
            wordsText: wordsText,
            cleanWordsText: cleanWordsText,
            extra: cleanWordsText.replace(cleanJapanese, '[EXTRA]'),
          });
        }
      } else {
        stats.partialCoverage++;
        if (issues.length < 20) {
          issues.push({
            type: 'mismatch',
            japanese: japanese,
            cleanJapanese: cleanJapanese,
            wordsText: wordsText,
            cleanWordsText: cleanWordsText,
          });
        }
      }

    } catch (e) {
      console.error(`Error processing line ${i}:`, e.message);
    }
  }

  // Calculate percentages
  const perfectPct = (stats.perfectCoverage / stats.totalSentences * 100).toFixed(1);
  const partialPct = (stats.partialCoverage / stats.totalSentences * 100).toFixed(1);
  const noPct = (stats.noCoverage / stats.totalSentences * 100).toFixed(1);
  const overPct = (stats.overCoverage / stats.totalSentences * 100).toFixed(1);

  console.log('='.repeat(70));
  console.log('WORD COVERAGE REPORT');
  console.log('='.repeat(70));
  console.log(`\nTotal sentences: ${stats.totalSentences}`);
  console.log();
  console.log(`${'COVERAGE'.padEnd(40)}${'COUNT'.padStart(10)}${'%'.padStart(10)}`);
  console.log('-'.repeat(70));
  console.log(`${'Perfect coverage (100%)'.padEnd(40)}${stats.perfectCoverage.toString().padStart(10)}${(perfectPct + '%').padStart(10)}`);
  console.log(`${'Partial coverage (missing text)'.padEnd(40)}${stats.partialCoverage.toString().padStart(10)}${(partialPct + '%').padStart(10)}`);
  console.log(`${'Over coverage (extra text)'.padEnd(40)}${stats.overCoverage.toString().padStart(10)}${(overPct + '%').padStart(10)}`);
  console.log(`${'No coverage (no words)'.padEnd(40)}${stats.noCoverage.toString().padStart(10)}${(noPct + '%').padStart(10)}`);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`COVERAGE SCORE: ${perfectPct}%`);
  console.log(`${'='.repeat(70)}`);

  // Show sample issues
  if (issues.length > 0) {
    console.log('\n⚠️  Sample coverage issues:\n');
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.type.toUpperCase()}]`);
      console.log(`   Original: ${issue.japanese}`);
      console.log(`   Clean JP: ${issue.cleanJapanese}`);
      console.log(`   Words:    ${issue.wordsText || 'none'}`);
      console.log(`   Clean WD: ${issue.cleanWordsText || 'none'}`);
      if (issue.missing) console.log(`   Missing:  ${issue.missing}`);
      if (issue.extra) console.log(`   Extra:    ${issue.extra}`);
      console.log();
    });
  }

  if (stats.perfectCoverage === stats.totalSentences) {
    console.log('✨ Perfect! All sentences have 100% word coverage.');
  } else {
    console.log(`\n⚠️  ${stats.partialCoverage + stats.noCoverage + stats.overCoverage} sentences need coverage fixes.`);
  }

  console.log();
}

if (require.main === module) {
  verifyCoverage();
}

module.exports = { verifyCoverage };
