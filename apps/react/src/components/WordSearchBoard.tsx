import { useState, useRef } from "react";
import { getCellsOnLine, type Cell, type Placement, type WordEntry } from "../utils/wordSearchGen";
import type { FoundInfo } from "../lib/wordSearchGame";

interface Props {
  grid: string[][];
  found: Record<string, FoundInfo>;
  wordList: WordEntry[];
  placements: Placement[];
  onWordFound: (wordIndex: number, positions: [number, number][]) => void;
  active: boolean;
}

function arrEq(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function cellFromPoint(x: number, y: number): Cell | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!el) return null;
  const r = el.dataset.r;
  const c = el.dataset.c;
  if (r == null || c == null) return null;
  return [+r, +c];
}

export function WordSearchBoard({ grid, found, wordList, placements, onWordFound, active }: Props) {
  const startRef = useRef<Cell | null>(null);
  const endRef   = useRef<Cell | null>(null);

  const [selStart, setSelStart] = useState<Cell | null>(null);
  const [selEnd,   setSelEnd]   = useState<Cell | null>(null);
  const [flashCells, setFlashCells] = useState<Set<string>>(new Set());

  const selCells = selStart && selEnd ? getCellsOnLine(selStart, selEnd) : [];
  const selSet   = new Set(selCells.map(([r, c]) => `${r},${c}`));

  const foundCellMap = new Map<string, FoundInfo>();
  for (const info of Object.values(found)) {
    for (const [r, c] of info.positions) foundCellMap.set(`${r},${c}`, info);
  }

  const placedIdxSet = new Set(placements.map((p) => p.wordIndex));

  function validate(cells: Cell[]) {
    if (cells.length < 2) return;
    const picked = cells.map(([r, c]) => grid[r][c]);
    const rev    = [...picked].reverse();

    for (const [i, word] of wordList.entries()) {
      if (!placedIdxSet.has(i) || found[String(i)]) continue;
      if (arrEq(picked, word.pinyinChars) || arrEq(rev, word.pinyinChars)) {
        onWordFound(i, cells as [number, number][]);
        return;
      }
    }
    setFlashCells(new Set(cells.map(([r, c]) => `${r},${c}`)));
    setTimeout(() => setFlashCells(new Set()), 400);
  }

  function startSel(r: number, c: number) {
    if (!active) return;
    startRef.current = [r, c];
    endRef.current   = [r, c];
    setSelStart([r, c]);
    setSelEnd([r, c]);
  }

  function moveSel(r: number, c: number) {
    if (!startRef.current) return;
    endRef.current = [r, c];
    setSelEnd([r, c]);
  }

  function endSel() {
    if (!startRef.current) return;
    const s = startRef.current;
    const e = endRef.current ?? s;
    startRef.current = null;
    endRef.current   = null;
    setSelStart(null);
    setSelEnd(null);
    validate(getCellsOnLine(s, e));
  }

  return (
    <div
      className="wsb-grid"
      onMouseDown={(e) => {
        const cell = cellFromPoint(e.clientX, e.clientY);
        if (cell) startSel(cell[0], cell[1]);
      }}
      onMouseMove={(e) => {
        if (!startRef.current) return;
        const cell = cellFromPoint(e.clientX, e.clientY);
        if (cell) moveSel(cell[0], cell[1]);
      }}
      onMouseUp={endSel}
      onMouseLeave={endSel}
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (!t) return;
        e.preventDefault();
        const cell = cellFromPoint(t.clientX, t.clientY);
        if (cell) startSel(cell[0], cell[1]);
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (!t) return;
        e.preventDefault();
        const cell = cellFromPoint(t.clientX, t.clientY);
        if (cell) moveSel(cell[0], cell[1]);
      }}
      onTouchEnd={(e) => { e.preventDefault(); endSel(); }}
    >
      {grid.map((row, r) =>
        row.map((ch, c) => {
          const key       = `${r},${c}`;
          const isSel     = selSet.has(key);
          const isFlash   = flashCells.has(key);
          const foundInfo = foundCellMap.get(key);

          let cls = "wsb-cell";
          if (isSel)          cls += " wsb-cell--sel";
          else if (isFlash)   cls += " wsb-cell--flash";
          else if (foundInfo) cls += " wsb-cell--found";

          const style = foundInfo && !isSel
            ? { background: foundInfo.color + "44", borderColor: foundInfo.color, color: "#111", fontWeight: 700 }
            : undefined;

          return (
            <div
              key={key} data-r={r} data-c={c}
              className={cls} style={style}
            >
              {ch}
            </div>
          );
        })
      )}
    </div>
  );
}
