const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || 'YOUR_API_KEY_HERE';

const DIFFICULTY_INSTRUCTION = {
  Mixed: 'Use natural, casual Japanese (口語) at any level — kanji + hiragana + katakana as appropriate.',
  N5: 'Use only N5-level vocabulary and simple grammar. Very short sentences (under 15 characters). Basic kanji only (日、本、人、口、手 etc).',
  N4: 'Use N4-level vocabulary and grammar. Short sentences. Common kanji like 食、飲、見、来、行 etc.',
  N3: 'Use N3-level vocabulary and grammar. Medium sentences. Include some less common kanji.',
  N2: 'Use N2-level vocabulary. Longer, more complex sentences. Include compound kanji words.',
  N1: 'Use N1-level vocabulary. Complex, natural sentences a native speaker would write. Include advanced kanji.',
};

const DOMAIN_INSTRUCTION = {
  Any: 'anything natural — daily life, food, weather, gaming, anime, sports, feelings',
  'Food & drink': 'food, drinks, restaurants, cooking, or convenience store runs',
  'Anime & manga': 'anime reactions, episode talk, character opinions, or manga recommendations',
  Gaming: 'video games, match results, gacha pulls, grinding, or game releases',
  'Weather & seasons': 'weather, seasons, temperature, or nature',
  Relationships: 'friends, family, crushes, drama, or social situations',
  'Work & school': 'work stress, exams, classes, colleagues, or Monday morning complaints',
  Sports: 'match reactions, favourite teams, working out, or athletic achievements',
  Travel: 'trains, trips, sightseeing, or getting lost',
  'Daily life': 'waking up, being tired, chores, what to eat, or random observations',
};

export async function generateSnippet(difficulty = 'Mixed', domain = 'Any', focusKanji = []) {
  const difficultyNote = DIFFICULTY_INSTRUCTION[difficulty] || DIFFICULTY_INSTRUCTION.Mixed;
  const domainNote = DOMAIN_INSTRUCTION[domain] || DOMAIN_INSTRUCTION.Any;
  const focusNote = focusKanji.length > 0
    ? `- The sentence MUST naturally use at least one of these kanji (the learner struggles with them): ${focusKanji.join('、')}`
    : '';

  const prompt = `Generate a short, authentic Japanese social media snippet — the kind of thing a real person would post on Twitter/X in Japan.

Rules:
- 1-3 sentences max
- ${difficultyNote}
- No formal/textbook Japanese
- No emojis
- Topic: ${domainNote}${focusNote ? '\n- ' + focusNote.slice(2) : ''}
- Return ONLY valid JSON, no markdown, no explanation

Return this exact JSON structure:
{
  "japanese": "the Japanese text here",
  "english": "natural English translation here",
  "words": [
    { "word": "日本語", "furigana": "にほんご", "meaning": "Japanese language" }
  ]
}

The words array should contain:
- Every kanji-containing word in the snippet, with its furigana (hiragana reading) and English meaning
- Every katakana word in the snippet, with its furigana (hiragana reading) and English meaning

Include ALL kanji and katakana words — do not skip any.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  const text = data.content[0].text.trim();
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
