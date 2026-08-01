import { useEffect, useState, RefObject } from 'react';
import { BOARD_WIDTH, VISIBLE_HEIGHT } from '../../engine/types';

/** Below this the board stops being readable; above it, it stops being useful. */
export const MIN_CELL_SIZE = 8;
export const MAX_CELL_SIZE = 64;

/**
 * Largest whole-pixel cell size that fits the board inside the given box.
 * Integral sizes keep every cell edge on a pixel boundary, which is what keeps
 * the grid crisp once the canvas is scaled for HiDPI.
 */
export function computeCellSize(availableWidth: number, availableHeight: number): number {
  const byWidth = availableWidth / BOARD_WIDTH;
  const byHeight = availableHeight / VISIBLE_HEIGHT;
  const fitted = Math.floor(Math.min(byWidth, byHeight));

  if (!Number.isFinite(fitted)) return MIN_CELL_SIZE;
  return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, fitted));
}

/**
 * Tracks an element's size and reports the cell size the board should use, so
 * the playfield always fills the actual view rather than a fixed pixel budget.
 */
export function useBoardScale(containerRef: RefObject<HTMLElement>): number {
  const [cellSize, setCellSize] = useState<number>(MIN_CELL_SIZE);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setCellSize(computeCellSize(width, height));
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  return cellSize;
}
