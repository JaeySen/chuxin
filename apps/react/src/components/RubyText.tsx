// Shared pinyin ruby-annotation renderer used by interactive exercise pages
// (ported from chuxin-teachers-docs/k34 standalone HTML files).
export type PinyinPairs = [string, string][];

export function RubyText({ pairs, fallback }: { pairs?: PinyinPairs; fallback: string }) {
  if (!pairs || pairs.length === 0) return <>{fallback}</>;
  return (
    <>
      {pairs.map(([ch, py], i) =>
        py ? (
          <ruby key={i}>
            {ch}
            <rt>{py}</rt>
          </ruby>
        ) : (
          <span key={i}>{ch}</span>
        )
      )}
    </>
  );
}

/**
 * Tone-sandhi handling for 一 (yī) and 不 (bù): their real pronunciation depends
 * on the tone of the syllable that follows. We only override the dictionary's
 * base reading when the following syllable's tone is unambiguous (carries a
 * tone mark) — this naturally skips neutral-tone / unknown-next-char cases
 * (e.g. "一个" -> "ge" has no mark) where the dictionary's own entry is kept.
 */
const TONE_MARK_TONE: Record<string, 1 | 2 | 3 | 4> = {
  ā: 1, ē: 1, ī: 1, ō: 1, ū: 1, ǖ: 1,
  á: 2, é: 2, í: 2, ó: 2, ú: 2, ǘ: 2,
  ǎ: 3, ě: 3, ǐ: 3, ǒ: 3, ǔ: 3, ǚ: 3,
  à: 4, è: 4, ì: 4, ò: 4, ù: 4, ǜ: 4,
};

function syllableTone(py: string): 1 | 2 | 3 | 4 | 0 {
  for (const c of py) {
    const t = TONE_MARK_TONE[c];
    if (t) return t;
  }
  return 0;
}

function applyToneSandhi(ch: string, basePy: string, nextPy: string | undefined): string {
  if (!basePy || (ch !== "一" && ch !== "不")) return basePy;
  const tone = nextPy ? syllableTone(nextPy) : 0;
  if (ch === "一") {
    if (tone === 4) return "yí";
    if (tone === 1 || tone === 2 || tone === 3) return "yì";
    return basePy;
  }
  // ch === "不"
  if (tone === 4) return "bú";
  if (tone === 1 || tone === 2 || tone === 3) return "bù";
  return basePy;
}

/** Build pinyin pairs for a Chinese string using a per-character lookup dict. */
export function pairsFromDict(text: string, dict: Record<string, string>): PinyinPairs {
  const chars = Array.from(text);
  return chars.map((ch, i) => {
    const basePy = dict[ch] ?? "";
    const nextPy = dict[chars[i + 1]];
    const py = applyToneSandhi(ch, basePy, nextPy);
    return [ch, py];
  });
}
