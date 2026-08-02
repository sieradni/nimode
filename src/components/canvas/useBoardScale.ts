import { useEffect, useState, RefObject } from 'react';
import { BOARD_WIDTH, RENDER_HEIGHT } from '../../engine/types';

/** Below this the board stops being readable; above it, it stops being useful. */
export const MIN_CELL_SIZE = 8;
export const MAX_CELL_SIZE = 64;

/**
 * Hold/queue previews render smaller than the playfield so a single piece does
 * not dominate the panel. 2/3 keeps the same feel as the original fixed sizes
 * (board cell 30 -> preview cell 20) while scaling smoothly with the board.
 */
export const PREVIEW_SCALE_FACTOR = 2 / 3;
const MIN_PREVIEW_CELL_SIZE = 4;

/** Horizontal gap between the board and its flanking panels, in CSS pixels. */
export const LAYOUT_GAP_PX = 16;

/**
 * Width each flanking column consumes, expressed in board-cell units so the
 * cell-size fit can be solved in closed form (no measure/resize feedback loop).
 * Two columns, each a 4-wide preview slot scaled by the preview factor.
 */
const FLANK_CELL_COEFFICIENT = 2 * 4 * PREVIEW_SCALE_FACTOR;
const RESERVED_GAPS_PX = 2 * LAYOUT_GAP_PX;

/** Largest whole-pixel cell size that fits the board inside the given box. */
export function computeCellSize(availableWidth: number, availableHeight: number): number {
  const byWidth = availableWidth / BOARD_WIDTH;
  const byHeight = availableHeight / RENDER_HEIGHT;
  const fitted = Math.floor(Math.min(byWidth, byHeight));

  if (!Number.isFinite(fitted)) return MIN_CELL_SIZE;
  return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, fitted));
}

/**
 * Like {@link computeCellSize} but reserves horizontal room for the two flanking
 * panels (hold/stats on the left, queue on the right) so the whole layout -
 * board plus panels - fits the viewport instead of overflowing it.
 */
export function computeLayoutCellSize(availableWidth: number, availableHeight: number): number {
  const byWidth = (availableWidth - RESERVED_GAPS_PX) / (BOARD_WIDTH + FLANK_CELL_COEFFICIENT);
  const byHeight = availableHeight / RENDER_HEIGHT;
  const fitted = Math.floor(Math.min(byWidth, byHeight));

  if (!Number.isFinite(fitted)) return MIN_CELL_SIZE;
  return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, fitted));
}

/** Preview cell size derived from the board cell size. */
export function computePreviewCellSize(boardCellSize: number): number {
  return Math.max(MIN_PREVIEW_CELL_SIZE, Math.round(boardCellSize * PREVIEW_SCALE_FACTOR));
}

/**
 * Tracks the layout container's size and reports the cell size the board should
 * use, reserving space for the flanking panels so everything scales together.
 */
export function useBoardScale(containerRef: RefObject<HTMLElement | null>): number {
  const [cellSize, setCellSize] = useState<number>(MIN_CELL_SIZE);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setCellSize(computeLayoutCellSize(width, height));
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
