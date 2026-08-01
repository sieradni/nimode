import { useRef } from 'react';

export interface StrokeCell {
  x: number;
  y: number;
}

export interface AnnotationStroke {
  begin(): void;
  add(x: number, y: number): void;
  end(): StrokeCell[];
}

/**
 * Accumulates the cells painted during one continuous drawing stroke.
 *
 * Auto-color needs the cells the player just drew — not everything on the
 * board — so a shape drawn next to an existing piece is matched on its own
 * geometry instead of merging with its neighbour.
 *
 * Held in a ref rather than state: the cells change on every pointer move and
 * must not drive a re-render mid-stroke.
 */
export function useAnnotationStroke(): AnnotationStroke {
  const cells = useRef<StrokeCell[]>([]);
  const seen = useRef<Set<string>>(new Set());

  return {
    begin() {
      cells.current = [];
      seen.current = new Set();
    },
    add(x: number, y: number) {
      const key = `${x},${y}`;
      if (seen.current.has(key)) return;
      seen.current.add(key);
      cells.current.push({ x, y });
    },
    end() {
      const result = cells.current;
      cells.current = [];
      seen.current = new Set();
      return result;
    },
  };
}
