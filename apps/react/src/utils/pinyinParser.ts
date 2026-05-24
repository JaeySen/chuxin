// Maps each diacritic vowel to its base vowel and tone number (1–4).
// No diacritic = tone 5 (neutral).
const DIACRITIC_MAP: Record<string, [string, number]> = {
  'ā': ['a', 1], 'á': ['a', 2], 'ǎ': ['a', 3], 'à': ['a', 4],
  'ē': ['e', 1], 'é': ['e', 2], 'ě': ['e', 3], 'è': ['e', 4],
  'ī': ['i', 1], 'í': ['i', 2], 'ǐ': ['i', 3], 'ì': ['i', 4],
  'ō': ['o', 1], 'ó': ['o', 2], 'ǒ': ['o', 3], 'ò': ['o', 4],
  'ū': ['u', 1], 'ú': ['u', 2], 'ǔ': ['u', 3], 'ù': ['u', 4],
  'ǖ': ['ü', 1], 'ǘ': ['ü', 2], 'ǚ': ['ü', 3], 'ǜ': ['ü', 4],
};

// Initials ordered so two-char ones (zh, ch, sh) are checked first.
const INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'];

export interface PinyinParts {
  initial: string;   // consonant, or "" for zero-initial (零声母)
  final: string;     // vowel nucleus + coda
  tone: number;      // 1–5
}

export function parsePinyin(pinyin: string): PinyinParts | null {
  // Only handle single-syllable (no spaces), skip erhua edge cases
  if (pinyin.includes(' ') || pinyin.includes('r') && pinyin.length > 2 && !INITIALS.includes(pinyin[0])) {
    // allow normal words ending in -r like "ér", just skip entries like "yīdiănr"
  }

  let base = pinyin;
  let tone = 5;

  for (const [diacritic, [vowel, t]] of Object.entries(DIACRITIC_MAP)) {
    if (base.includes(diacritic)) {
      base = base.replace(diacritic, vowel);
      tone = t;
      break;
    }
  }

  // No diacritic found means neutral tone (particles like 的, 吗, 了)
  let initial = '';
  for (const ini of INITIALS) {
    if (base.startsWith(ini)) {
      initial = ini;
      break;
    }
  }

  const final = base.slice(initial.length);
  if (!final) return null; // malformed

  return { initial, final, tone };
}

export const TONE_LABELS: Record<number, string> = {
  1: '— (thanh 1)',
  2: '/ (thanh 2)',
  3: 'ˇ (thanh 3)',
  4: '\\ (thanh 4)',
  5: '· (khinh thanh)',
};
