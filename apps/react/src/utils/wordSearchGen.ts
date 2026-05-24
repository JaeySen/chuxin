/**
 * Character-level Word Search generator.
 *
 * Each target word is expanded into its full pinyin spelling (one Latin
 * character per cell, including tone marks). Words are placed in 8 directions;
 * empty cells are filled with random pinyin characters from the fill pool.
 */

export type Cell = [number, number];

export interface WordEntry {
  char: string;          // e.g. "你好"
  pinyin: string;        // e.g. "nǐ hǎo"
  en: string;
  pinyinChars: string[]; // one character per cell, e.g. ["n","ǐ","h","ǎ","o"]
}

export interface Placement {
  wordIndex: number;
  positions: Cell[];
}

export interface BoardResult {
  grid: string[][];
  placed: Placement[];
}

const DIRS: Cell[] = [
  [0, 1], [0, -1], [1, 0], [-1, 0],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

const FILL_POOL_DEFAULT = "abcdefghijklmnopqrstuvwxyzāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü".split("");

/**
 * Split a space-separated pinyin string into a flat array of individual
 * Latin characters, preserving tone-marked vowels as single chars.
 *
 * "nǐ hǎo" → ["n","ǐ","h","ǎ","o"]
 * "zhōng guó" → ["z","h","ō","n","g","g","u","ó"]
 */
export function pinyinToChars(pinyin: string): string[] {
  return Array.from(pinyin.replace(/\s+/g, ""));
}

export function generateBoard(
  words: WordEntry[],
  size = 12,
  fillPool: string[] = FILL_POOL_DEFAULT,
): BoardResult {
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const placed: Placement[] = [];

  // Place longest words first to maximize fit success
  const order = words.map((w, i) => ({ w, i })).sort((a, b) => b.w.pinyinChars.length - a.w.pinyinChars.length);

  for (const { w, i } of order) {
    let ok = false;
    for (let attempt = 0; attempt < 500 && !ok; attempt++) {
      const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      const positions: Cell[] = [];
      let fits = true;

      for (let k = 0; k < w.pinyinChars.length; k++) {
        const nr = r + k * dr;
        const nc = c + k * dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) { fits = false; break; }
        const existing = grid[nr][nc];
        if (existing !== null && existing !== w.pinyinChars[k]) { fits = false; break; }
        positions.push([nr, nc]);
      }

      if (fits) {
        for (let k = 0; k < w.pinyinChars.length; k++) {
          grid[positions[k][0]][positions[k][1]] = w.pinyinChars[k];
        }
        placed.push({ wordIndex: i, positions });
        ok = true;
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = fillPool[Math.floor(Math.random() * fillPool.length)];
      }
    }
  }

  return { grid: grid as string[][], placed };
}

/**
 * Return the straight line of cells from start → end if it's a valid
 * horizontal / vertical / diagonal selection; otherwise just [start].
 */
export function getCellsOnLine(start: Cell, end: Cell): Cell[] {
  const [r1, c1] = start;
  const [r2, c2] = end;
  const dr = r2 - r1;
  const dc = c2 - c1;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return [start];
  const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
  const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
  return Array.from({ length: len }, (_, k) => [r1 + k * stepR, c1 + k * stepC] as Cell);
}
