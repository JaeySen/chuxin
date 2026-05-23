export type Cell = [number, number];

const DIACRITIC_RE = /[̀-ͯ]/g;

export function stripTone(s: string): string {
  return s.normalize("NFD").replace(DIACRITIC_RE, "").replace(/ü/g, "u").toLowerCase();
}

export function getSyllables(pinyin: string): string[] {
  return pinyin.split(" ").map(stripTone).filter(Boolean);
}

// All 8 word-search directions
const DIRS: Cell[] = [
  [0, 1], [0, -1], [1, 0], [-1, 0],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

export interface PlacedWord {
  wordIndex: number;
  positions: Cell[];
}

export interface BoardResult {
  grid: string[][];
  placed: PlacedWord[];
}

export function generateBoard(
  wordSyllables: string[][], // one entry per word
  fillPool: string[],        // syllables for random fill
  size = 9
): BoardResult {
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );
  const placed: PlacedWord[] = [];

  // Sort descending by syllable count so longer words placed first
  const order = wordSyllables
    .map((syls, i) => ({ syls, i }))
    .sort((a, b) => b.syls.length - a.syls.length);

  for (const { syls, i } of order) {
    let ok = false;
    // Try up to 200 random placements
    for (let attempt = 0; attempt < 200 && !ok; attempt++) {
      const dir = DIRS[Math.floor(Math.random() * DIRS.length)];
      const [dr, dc] = dir;
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);

      const positions: Cell[] = [];
      let fits = true;
      for (let k = 0; k < syls.length; k++) {
        const nr = r + k * dr;
        const nc = c + k * dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) { fits = false; break; }
        const existing = grid[nr][nc];
        if (existing !== null && existing !== syls[k]) { fits = false; break; }
        positions.push([nr, nc]);
      }

      if (fits) {
        for (let k = 0; k < syls.length; k++) {
          grid[positions[k][0]][positions[k][1]] = syls[k];
        }
        placed.push({ wordIndex: i, positions });
        ok = true;
      }
    }
  }

  // Fill remaining cells with random syllables from the fill pool
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = fillPool[Math.floor(Math.random() * fillPool.length)];
      }
    }
  }

  return { grid: grid as string[][], placed };
}

// Returns all cells on the straight line from start → end.
// Returns just [start] if the direction is neither horiz, vert, nor diagonal.
export function getCellsOnLine(start: Cell, end: Cell): Cell[] {
  const [r1, c1] = start;
  const [r2, c2] = end;
  const dr = r2 - r1;
  const dc = c2 - c1;

  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
    return [start]; // invalid direction
  }

  const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
  const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

  return Array.from({ length: len }, (_, k) => [r1 + k * stepR, c1 + k * stepC] as Cell);
}
