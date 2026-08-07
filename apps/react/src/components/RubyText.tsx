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

/** Build pinyin pairs for a Chinese string using a per-character lookup dict. */
export function pairsFromDict(text: string, dict: Record<string, string>): PinyinPairs {
  return Array.from(text).map((ch) => [ch, dict[ch] ?? ""]);
}
