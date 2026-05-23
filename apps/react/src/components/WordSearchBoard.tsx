import { useState, useRef, useCallback } from "react";
import { getCellsOnLine, type Cell, type PlacedWord } from "../utils/wordSearchGen";
import type { WordEntry, FoundInfo } from "../lib/wordSearchGame";

interface Props {
  grid: string[][];
  found: Record<string, FoundInfo>;
  wordList: WordEntry[];
  placements: PlacedWord[];
  onWordFound: (wordKey: string, positions: [number, number][]) => void;
  active: boolean;
}

function arrEq(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function WordSearchBoard({
  grid,
  found,
  wordList,
  placements,
  onWordFound,
  active,
}: Props) {
  const [selStart, setSelStart] = useState<Cell | null>(null);
  const [selEnd, setSelEnd] = useState<Cell | null>(null);
  const [flashCells, setFlashCells] = useState<Set<string>>(new Set());
  const dragging = useRef(false);

  const selCells = selStart && selEnd ? getCellsOnLine(selStart, selEnd) : [];
  const selSet = new Set(selCells.map(([r, c]) => `${r},${c}`));

  // Build cell → found info lookup
  const foundCellMap = new Map<string, FoundInfo>();
  for (const info of Object.values(found)) {
    for (const [r, c] of info.positions) {
      foundCellMap.set(`${r},${c}`, info);
    }
  }

  const placedIdxSet = new Set(placements.map((p) => p.wordIndex));

  function validate(cells: Cell[]) {
    if (cells.length < 2) return;
    const syls = cells.map(([r, c]) => grid[r][c]);
    const rev = [...syls].reverse();

    for (const [i, word] of wordList.entries()) {
      if (!placedIdxSet.has(i)) continue; // not in grid
      if (found[word.char]) continue;     // already found
      if (arrEq(syls, word.syllables) || arrEq(rev, word.syllables)) {
        onWordFound(word.char, cells as [number, number][]);
        return;
      }
    }
    // No match — brief red flash
    const flashKey = new Set(cells.map(([r, c]) => `${r},${c}`));
    setFlashCells(flashKey);
    setTimeout(() => setFlashCells(new Set()), 400);
  }

  const startSel = useCallback((r: number, c: number) => {
    if (!active) return;
    dragging.current = true;
    setSelStart([r, c]);
    setSelEnd([r, c]);
  }, [active]);

  const moveSel = useCallback((r: number, c: number) => {
    if (!dragging.current) return;
    setSelEnd([r, c]);
  }, []);

  const endSel = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (selStart && selEnd) {
      validate(getCellsOnLine(selStart, selEnd));
    }
    setSelStart(null);
    setSelEnd(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selStart, selEnd]);

  // Touch: get cell under current touch point
  function cellFromTouch(e: React.TouchEvent): Cell | null {
    const t = e.touches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
    if (!el) return null;
    const r = el.dataset.r;
    const c = el.dataset.c;
    if (r == null || c == null) return null;
    return [+r, +c];
  }

  return (
    <div
      className="wsb-grid"
      onMouseUp={endSel}
      onMouseLeave={endSel}
    >
      {grid.map((row, r) =>
        row.map((syl, c) => {
          const key = `${r},${c}`;
          const isSel = selSet.has(key);
          const isFlash = flashCells.has(key);
          const foundInfo = foundCellMap.get(key);

          let cls = "wsb-cell";
          if (isSel) cls += " wsb-cell--sel";
          else if (isFlash) cls += " wsb-cell--flash";
          else if (foundInfo) cls += " wsb-cell--found";

          const style =
            foundInfo && !isSel
              ? {
                  background: foundInfo.color + "44",
                  borderColor: foundInfo.color,
                  color: "#111",
                  fontWeight: 700,
                }
              : undefined;

          return (
            <div
              key={key}
              data-r={r}
              data-c={c}
              className={cls}
              style={style}
              onMouseDown={() => startSel(r, c)}
              onMouseEnter={() => moveSel(r, c)}
              onTouchStart={(e) => { e.preventDefault(); startSel(r, c); }}
              onTouchMove={(e) => {
                e.preventDefault();
                const cell = cellFromTouch(e);
                if (cell) moveSel(cell[0], cell[1]);
              }}
              onTouchEnd={(e) => { e.preventDefault(); endSel(); }}
            >
              {syl}
            </div>
          );
        })
      )}
    </div>
  );
}
