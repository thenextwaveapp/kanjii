
-- Kanji dictionary table (lite version without stroke paths)
CREATE TABLE IF NOT EXISTS kanji_dictionary (
  kanji TEXT PRIMARY KEY,
  meaning TEXT NOT NULL,
  readings TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kanji_dictionary ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "kanji_dictionary_read" ON kanji_dictionary
  FOR SELECT USING (true);


-- Insert kanji data

INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('一', 'one', ARRAY['ichi', 'itsu', 'hito']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('乙', 'latter', ARRAY['otsu']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('九', 'nine', ARRAY['kyuu', 'ku', 'kokono']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('七', 'seven', ARRAY['shichi', 'nana']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('十', 'ten', ARRAY['juu', 'ji', 'too', 'to']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('人', 'person', ARRAY['jin', 'nin', 'hito']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('丁', 'ward', ARRAY['chou', 'tei']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('刀', 'sword', ARRAY['tou', 'katana']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('二', 'two', ARRAY['ni', 'futa']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('入', 'enter', ARRAY['nyuu', 'i', 'hai']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('八', 'eight', ARRAY['hachi', 'ya']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('又', 'or', ARRAY['mata']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('了', 'finish', ARRAY['ryou']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('力', 'power', ARRAY['ryoku', 'riki', 'chikara']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('下', 'below', ARRAY['ka', 'ge', 'shita', 'shimo', 'moto', 'sa', 'kuda', 'o']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('干', 'dry', ARRAY['kan', 'ho', 'hi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('丸', 'circle', ARRAY['gan', 'maru']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('久', 'long time', ARRAY['kyuu', 'hisa']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('及', 'reach out', ARRAY['kyuu', 'oyo']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('弓', 'bow', ARRAY['kyuu', 'yumi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('巾', 'towel', ARRAY['kin']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('己', 'self', ARRAY['ko', 'ki', 'onore']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('口', 'mouth', ARRAY['kou', 'ku', 'kuchi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('工', 'craft', ARRAY['kou', 'ku']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('乞', 'beg', ARRAY['ko']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('才', 'genius', ARRAY['sai']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('三', 'three', ARRAY['san', 'mi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('山', 'mountain', ARRAY['san', 'yama']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('士', 'gentleman', ARRAY['shi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('子', 'child', ARRAY['shi', 'su', 'ko']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('女', 'woman', ARRAY['jo', 'nyo', 'onna', 'me']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('小', 'small', ARRAY['shou', 'chii', 'ko', 'o']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('上', 'up', ARRAY['jou', 'ue', 'kami', 'a', 'nobo']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('丈', 'length', ARRAY['jou', 'take']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('刃', 'blade', ARRAY['jin', 'ha']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('寸', 'measurement', ARRAY['sun']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('夕', 'evening', ARRAY['seki', 'yuu']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('千', 'thousand', ARRAY['sen', 'chi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('川', 'river', ARRAY['sen', 'kawa']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('大', 'large', ARRAY['dai', 'tai', 'oo']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('土', 'soil', ARRAY['do', 'to', 'tsuchi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('亡', 'deceased', ARRAY['bou', 'na']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('凡', 'mediocre', ARRAY['bon']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('万', 'ten thousand', ARRAY['man', 'ban']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('与', 'give', ARRAY['yo', 'ata']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('引', 'pull', ARRAY['in', 'hi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('円', 'round', ARRAY['en', 'maru']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('王', 'king', ARRAY['ou']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('化', 'change', ARRAY['ka', 'ke', 'ba']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('火', 'fire', ARRAY['ka', 'hi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('牙', 'tusk', ARRAY['ga', 'kiba']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('介', 'jammed in', ARRAY['kai']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('刈', 'reap', ARRAY['ka']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('牛', 'cow', ARRAY['gyuu', 'ushi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('凶', 'villain', ARRAY['kyou']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('斤', 'axe', ARRAY['kin']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('区', 'ward', ARRAY['ku']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('欠', 'lack', ARRAY['ketsu', 'ka']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('月', 'moon', ARRAY['getsu', 'gatsu', 'tsuki']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('犬', 'dog', ARRAY['ken', 'inu']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('元', 'origin', ARRAY['gen', 'gan', 'moto']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('幻', 'phantasm', ARRAY['gen', 'maboroshi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('戸', 'door', ARRAY['ko', 'to']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('五', 'five', ARRAY['go', 'itsu']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('互', 'mutually', ARRAY['go', 'taga']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('午', 'noon', ARRAY['go']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('公', 'public', ARRAY['kou', 'ooyake']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('勾', 'capture', ARRAY['kou']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('孔', 'cavity', ARRAY['kou']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('今', 'now', ARRAY['kon', 'kin', 'ima']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('支', 'branch', ARRAY['shi', 'sasa']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('止', 'stop', ARRAY['shi', 'to']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('氏', 'family name', ARRAY['shi', 'uji']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('尺', 'shaku', ARRAY['shaku']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('手', 'hand', ARRAY['shu', 'te']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('収', 'take in', ARRAY['shuu', 'osa']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('升', 'measuring box', ARRAY['shou', 'masu']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('少', 'few', ARRAY['shou', 'suku', 'suko']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('冗', 'superfluous', ARRAY['jou']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('心', 'heart', ARRAY['shin', 'kokoro']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('仁', 'humanity', ARRAY['jin']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('水', 'water', ARRAY['sui', 'mizu']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('井', 'well', ARRAY['sei', 'i']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('切', 'cut', ARRAY['setsu', 'ki']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('双', 'pair', ARRAY['sou', 'futa']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('太', 'thick', ARRAY['tai', 'ta', 'futo']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('丹', 'cinnabar', ARRAY['tan']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('中', 'middle', ARRAY['chuu', 'naka']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('弔', 'condolences', ARRAY['chou', 'tomura']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('爪', 'claw', ARRAY['tsume']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('天', 'heaven', ARRAY['ten', 'ame']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('斗', 'Big Dipper', ARRAY['to']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('屯', 'barracks', ARRAY['ton']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('内', 'inside', ARRAY['nai', 'uchi']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('匂', 'scent', ARRAY['nio']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('日', 'day', ARRAY['nichi', 'jitsu', 'hi', 'ka']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('反', 'anti-', ARRAY['han', 'so']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('比', 'compare', ARRAY['hi', 'kura']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('匹', 'equal', ARRAY['hitsu', 'hiki']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;
INSERT INTO kanji_dictionary (kanji, meaning, readings) VALUES ('不', 'non-', ARRAY['fu', 'bu']) ON CONFLICT (kanji) DO UPDATE SET meaning = EXCLUDED.meaning, readings = EXCLUDED.readings;