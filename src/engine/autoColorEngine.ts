import { BOARD_HEIGHT } from './types/board';
import type { AnnotationMatrix } from './types/annotations';
import { matchTetromino, type Position } from './autoColorShapes';

function copyAnnotations(annotations: AnnotationMatrix): AnnotationMatrix {
  const result: AnnotationMatrix = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    const row = annotations[y];
    result.push(row ? [...row] : []);
  }
  return result;
}

/**
 * Colors the cells drawn in a single stroke, matched on the stroke's own shape.
 *
 * Auto-color is scoped to the stroke: the cells the player just drew are
 * matched on their own geometry, so a stroke drawn immediately adjacent to an
 * already-annotated piece is still recognised instead of merging into one
 * oversized component (US-7.5, US-8.5).
 *
 * Stroke cells that are no longer filled (drawn then erased before the stroke
 * ended) and duplicates from overlapping pointer moves are ignored. Cells
 * holding a recognised shape are promoted from their picked colour
 * (`PALETTE_CELL_OFFSET + i`) to a tetromino type (1..7).
 */
export function autoColorStroke(
  annotations: AnnotationMatrix,
  stroke: ReadonlyArray<Position>,
): AnnotationMatrix {
  const result = copyAnnotations(annotations);

  const seen = new Set<string>();
  const cells: Position[] = [];
  for (const cell of stroke) {
    const key = `${cell.x},${cell.y}`;
    if (seen.has(key)) continue;
    if (!annotations[cell.y]?.[cell.x]) continue;
    seen.add(key);
    cells.push(cell);
  }

  const matchedType = matchTetromino(cells);
  if (matchedType === undefined) return result;

  for (const cell of cells) {
    const row = result[cell.y];
    if (row) {
      row[cell.x] = matchedType;
    }
  }

  return result;
}
