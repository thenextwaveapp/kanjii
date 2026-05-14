# JLPT Vocabulary Data

## Setup

Download the JLPT word lists from https://github.com/elzup/jlpt-word-list

Place the CSV files in this directory:
- `n5.csv`
- `n4.csv`
- `n3.csv`
- `n2.csv`
- `n1.csv`

### Quick download:

```bash
cd data
curl -O https://raw.githubusercontent.com/elzup/jlpt-word-list/master/src/n5.csv
curl -O https://raw.githubusercontent.com/elzup/jlpt-word-list/master/src/n4.csv
curl -O https://raw.githubusercontent.com/elzup/jlpt-word-list/master/src/n3.csv
curl -O https://raw.githubusercontent.com/elzup/jlpt-word-list/master/src/n2.csv
curl -O https://raw.githubusercontent.com/elzup/jlpt-word-list/master/src/n1.csv
```

## CSV Format

Each file has these columns:
- `expression`: Japanese word
- `reading`: Hiragana/katakana pronunciation
- `meaning`: English definition
- `tags`: JLPT level tags
