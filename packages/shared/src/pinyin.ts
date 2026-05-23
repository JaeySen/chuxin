const TONE_MAP: Record<string, string> = {
  ā: "a", á: "a", ǎ: "a", à: "a",
  ē: "e", é: "e", ě: "e", è: "e",
  ī: "i", í: "i", ǐ: "i", ì: "i",
  ō: "o", ó: "o", ǒ: "o", ò: "o",
  ū: "u", ú: "u", ǔ: "u", ù: "u",
  ǖ: "u", ǘ: "u", ǚ: "u", ǜ: "u",
  ü: "u",
  Ā: "A", Á: "A", Ǎ: "A", À: "A",
};

export function stripTones(s: string): string {
  return s.replace(/./g, (ch) => TONE_MAP[ch] ?? ch);
}

export function normalize(s: string): string {
  return stripTones(s).toLowerCase().replace(/\s+/g, " ").trim();
}

export function answerMatches(
  input: string,
  answer: string,
  alternatives: string[] = [],
  opts: { caseSensitive?: boolean; toneSensitive?: boolean } = {},
): boolean {
  const prep = (s: string) => {
    let v = s.replace(/\s+/g, " ").trim();
    if (!opts.caseSensitive) v = v.toLowerCase();
    if (!opts.toneSensitive) v = stripTones(v);
    return v;
  };
  const target = prep(input);
  return [answer, ...alternatives].some((a) => prep(a) === target);
}
