import { useEffect, useState, RefObject } from 'react';
import { BOARD_WIDTH, RENDER_HEIGHT } from '../../engine/types';

/** Below this the board stops being readable; above it, it stops being useful. */
export const MIN_CELL_SIZE = 8;
export const MAX_CELL_SIZE = 64;

/**
 * Hold/queue previews render close to the playfield size so tetrominos in the
 * preview match the on-board pieces (US-7.7). A 0.9 factor keeps previews
 * slightly smaller than the field while scaling smoothly with the board.
 */
export const PREVIEW_SCALE_FACTOR = 0.9;
const MIN_PREVIEW_CELL_SIZE = 4;

/** Horizontal gap between the board and its flanking panels, in CSS pixels. */
export const LAYOUT_GAP_PX = 16;

/**
 * When the container is at least this much taller than it is wide (a phone in
 * portrait), the flanking panels collapse: the stats are hidden and the hold
 * moves above the queue so only one side column reserves horizontal space.
 */
export const COMPACT_ASPECT_THRESHOLD = 1.5;

/**
 * A tall, narrow container leaves little horizontal room for two side columns
 * and the board alike, so the layout drops into the compact single-column
 * variant.
 */
export function shouldUseCompactLayout(availableWidth: number, availableHeight: number): boolean {
  return availableWidth > 0 && availableHeight / availableWidth >= COMPACT_ASPECT_THRESHOLD;
}

/** Width a single flanking column consumes, in board-cell units (see useBoardScale). */
const SINGLE_FLANK_CELL_COEFFICIENT = 4 * PREVIEW_SCALE_FACTOR;
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
 * Like {@link computeCellSize} but reserves horizontal room for the flanking
 * panels (hold/stats + queue, or just the queue in compact mode) so the whole
 * layout - board plus panels - fits the viewport instead of overflowing it.
 */
export function computeLayoutCellSize(
  availableWidth: number,
  availableHeight: number,
  compact = false,
): number {
  const flankColumns = compact ? 1 : 2;
  const reservedGapsPx = compact ? LAYOUT_GAP_PX : RESERVED_GAPS_PX;
  const byWidth =
    (availableWidth - reservedGapsPx) / (BOARD_WIDTH + flankColumns * SINGLE_FLANK_CELL_COEFFICIENT);
  const byHeight = availableHeight / RENDER_HEIGHT;
  const fitted = Math.floor(Math.min(byWidth, byHeight));

  if (!Number.isFinite(fitted)) return MIN_CELL_SIZE;
  return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, fitted));
}

/** Preview cell size derived from the board cell size. */
export function computePreviewCellSize(boardCellSize: number): number {
  return Math.max(MIN_PREVIEW_CELL_SIZE, Math.round(boardCellSize * PREVIEW_SCALE_FACTOR));
}

export interface BoardLayout {
  /** Whole-pixel cell size the board should use. */
  cellSize: number;
  /** True when the container is tall enough for the compact single-column layout. */
  compact: boolean;
}

/**
 * Tracks the layout container's size and reports the cell size the board should
 * use and whether the compact layout should be active, reserving flanking space
 * (one column in compact mode, two otherwise) so everything scales together.
 */
export function useBoardScale(containerRef: RefObject<HTMLElement | null>): BoardLayout {
  const [layout, setLayout] = useState<BoardLayout>({ cellSize: MIN_CELL_SIZE, compact: false });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      const compact = shouldUseCompactLayout(width, height);
      setLayout({
        cellSize: computeLayoutCellSize(width, height, compact),
        compact,
      });
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

  return layout;
}
