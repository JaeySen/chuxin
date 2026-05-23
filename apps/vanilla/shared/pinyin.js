const TONE_MAP = {
  ā: "a", á: "a", ǎ: "a", à: "a",
  ē: "e", é: "e", ě: "e", è: "e",
  ī: "i", í: "i", ǐ: "i", ì: "i",
  ō: "o", ó: "o", ǒ: "o", ò: "o",
  ū: "u", ú: "u", ǔ: "u", ù: "u",
  ǖ: "u", ǘ: "u", ǚ: "u", ǜ: "u",
  ü: "u",
};

export function stripTones(s) {
  return s.replace(/./g, (ch) => TONE_MAP[ch] ?? ch);
}

export function answerMatches(input, answer, alternatives = [], opts = {}) {
  const prep = (s) => {
    let v = String(s).replace(/\s+/g, " ").trim();
    if (!opts.caseSensitive) v = v.toLowerCase();
    if (!opts.toneSensitive) v = stripTones(v);
    return v;
  };
  const target = prep(input);
  return [answer, ...alternatives].some((a) => prep(a) === target);
}
