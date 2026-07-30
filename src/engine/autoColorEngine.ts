import { BOARD_HEIGHT, BOARD_WIDTH } from './types/board';
import type { AnnotationMatrix } from './types/annotations';
import type { PieceType } from './types/piece';
import { getPieceMatrix } from './systems/SrsPlusRotationSystem';

type Position = { x: number; y: number };

function tryEnqueueNeighbor(
  queue: Position[],
  visited: boolean[][],
  annotations: AnnotationMatrix,
  x: number,
  y: number,
): void {
  if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) return;
  const vRow = visited[y];
  if (!vRow) return;
  if (vRow[x]) return;
  const aRow = annotations[y];
  if (!aRow) return;
  if (!aRow[x]) return;
  vRow[x] = true;
  queue.push({ x, y });
}

function floodFillComponents(annotations: AnnotationMatrix): Position[][] {
  const visited: boolean[][] = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    visited.push(new Array(BOARD_WIDTH).fill(false));
  }

  const components: Position[][] = [];

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    const visitedRow = visited[y];
    if (!visitedRow) continue;
    const annRow = annotations[y];
    if (!annRow) continue;

    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (visitedRow[x]) continue;
      if (!annRow[x]) {
        visitedRow[x] = true;
        continue;
      }

      const component: Position[] = [];
      const queue: Position[] = [{ x, y }];
      visitedRow[x] = true;

      while (queue.length > 0) {
        const pos = queue.shift();
        if (!pos) break;

        const aRow = annotations[pos.y];
        if (!aRow) continue;
        if (!aRow[pos.x]) continue;

        component.push(pos);

        tryEnqueueNeighbor(queue, visited, annotations, pos.x - 1, pos.y);
        tryEnqueueNeighbor(queue, visited, annotations, pos.x + 1, pos.y);
        tryEnqueueNeighbor(queue, visited, annotations, pos.x, pos.y - 1);
        tryEnqueueNeighbor(queue, visited, annotations, pos.x, pos.y + 1);
      }

      components.push(component);
    }
  }

  return components;
}

function normalizePositions(positions: Position[]): string {
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

const canonicalKeys = buildCanonicalShapeKeys();

export function autoColorAnnotations(annotations: AnnotationMatrix): AnnotationMatrix {
  const components = floodFillComponents(annotations);

  const result: AnnotationMatrix = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    const row = annotations[y];
    result.push(row ? [...row] : []);
  }

  for (const component of components) {
    if (component.length !== 4) continue;

    const key = normalizePositions(component);
    const matchedType = canonicalKeys.get(key);

    if (matchedType !== undefined) {
      for (const cell of component) {
        const row = result[cell.y];
        if (row) {
          row[cell.x] = matchedType;
        }
      }
    }
  }

  return result;
}
