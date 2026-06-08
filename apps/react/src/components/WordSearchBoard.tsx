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
  // Mouse: click-to-start, hover-to-preview, click-to-end
  const [mouseStart, setMouseStart] = useState<Cell | null>(null);
  const [mouseHover, setMouseHover] = useState<Cell | null>(null);

  // Touch: drag (refs so touch handlers never go stale)
  const touchStartRef = useRef<Cell | null>(null);
  const touchEndRef   = useRef<Cell | null>(null);
  const [touchSel, setTouchSel] = useState<{ start: Cell; end: Cell } | null>(null);

  const [flashCells, setFlashCells] = useState<Set<string>>(new Set());

  // Which cells are currently highlighted
  const selCells = (() => {
    if (touchSel) return getCellsOnLine(touchSel.start, touchSel.end);
    if (mouseStart && mouseHover) return getCellsOnLine(mouseStart, mouseHover);
    if (mouseStart) return [mouseStart];
    return [];
  })();
  const selSet = new Set(selCells.map(([r, c]) => `${r},${c}`));

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

  // ── Mouse handlers (click-click model) ──────────────────────────────────

  function handleMouseClick(e: React.MouseEvent) {
    if (!active) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;

    if (!mouseStart) {
      // First click: set start
      setMouseStart(cell);
      setMouseHover(cell);
    } else {
      // Second click: commit
      const cells = getCellsOnLine(mouseStart, cell);
      setMouseStart(null);
      setMouseHover(null);
      validate(cells);
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!mouseStart) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell) setMouseHover(cell);
  }

  function handleMouseLeave() {
    // Don't cancel selection on leave — user may move outside briefly
    // but keep mouseStart so they can come back or click elsewhere
  }

  // ── Touch handlers (drag model) ──────────────────────────────────────────

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    const cell = cellFromPoint(t.clientX, t.clientY);
    if (!cell) return;
    touchStartRef.current = cell;
    touchEndRef.current   = cell;
    setTouchSel({ start: cell, end: cell });
    // Cancel any pending mouse selection when touch starts
    setMouseStart(null);
    setMouseHover(null);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t || !touchStartRef.current) return;
    e.preventDefault();
    const cell = cellFromPoint(t.clientX, t.clientY);
    if (cell) {
      touchEndRef.current = cell;
      setTouchSel({ start: touchStartRef.current, end: cell });
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    e.preventDefault();
    if (!touchStartRef.current) return;
    const s = touchStartRef.current;
    const en = touchEndRef.current ?? s;
    touchStartRef.current = null;
    touchEndRef.current   = null;
    setTouchSel(null);
    validate(getCellsOnLine(s, en));
  }

  return (
    <div
      className="wsb-grid"
      onClick={handleMouseClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {grid.map((row, r) =>
        row.map((ch, c) => {
          const key        = `${r},${c}`;
          const isSel      = selSet.has(key);
          const isFlash    = flashCells.has(key);
          const foundInfo  = foundCellMap.get(key);
          const isAnchor   = mouseStart && mouseStart[0] === r && mouseStart[1] === c;

          let cls = "wsb-cell";
          if (isSel)          cls += " wsb-cell--sel";
          else if (isFlash)   cls += " wsb-cell--flash";
          else if (foundInfo) cls += " wsb-cell--found";
          if (isAnchor)       cls += " wsb-cell--anchor";

          const style = foundInfo && !isSel
            ? { background: foundInfo.color + "44", borderColor: foundInfo.color, color: "#111", fontWeight: 700 }
            : undefined;

          return (
            <div key={key} data-r={r} data-c={c} className={cls} style={style}>
              {ch}
            </div>
          );
        })
      )}
    </div>
  );
}
