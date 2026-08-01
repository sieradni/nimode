import type { PieceType } from './types/piece';
import { getPieceMatrix } from './systems/SrsPlusRotationSystem';

export type Position = { x: number; y: number };

/**
 * Translates a set of cells to the origin and serialises them in a stable
 * order, producing a key that identifies the shape regardless of where it was
 * drawn on the board.
 */
export function normalizePositions(positions: ReadonlyArray<Position>): string {
  if (positions.length === 0) return '';

  let minX = Infinity;
  let minY = Infinity;
  for (const p of positions) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
  }

  const normalized = positions
    .map(p => ({ x: p.x - minX, y: p.y - minY }))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  return normalized.map(p => `${p.x},${p.y}`).join(';');
}

function buildCanonicalShapeKeys(): Map<string, PieceType> {
  const map = new Map<string, PieceType>();
  const pieceTypes: PieceType[] = [1, 2, 3, 4, 5, 6, 7];
  const rotations: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];

  for (const type of pieceTypes) {
    for (const rotation of rotations) {
      const matrix = getPieceMatrix(type, rotation);
      const cells: Position[] = [];

      for (let y = 0; y < matrix.length; y++) {
        const row = matrix[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
          if (row[x] !== 0) {
            cells.push({ x, y });
          }
        }
      }

      const key = normalizePositions(cells);
      if (!map.has(key)) {
        map.set(key, type);
      }
    }
  }

  return map;
}

/** Every tetromino orientation, keyed by its normalised shape. */
export const canonicalKeys = buildCanonicalShapeKeys();

/** Resolves a set of four cells to the tetromino they form, if any. */
export function matchTetromino(cells: ReadonlyArray<Position>): PieceType | undefined {
  if (cells.length !== 4) return undefined;
  return canonicalKeys.get(normalizePositions(cells));
}
