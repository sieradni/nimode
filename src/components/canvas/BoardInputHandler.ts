import { RefObject, useState, useRef } from 'react';
import { BOARD_CELL_SIZE, type AnnotationTool } from './canvasConstants';
import { walkLineCells } from '../../utils/walkLineCells';
import { getCanvasCoordinates, isRightButton, type BoardCoord } from './boardPointerTools';
import type { EngineState } from '../../engine/interfaces/IEngineCore';
import type { EditMode } from '../../engine/types';

export { getCanvasCoordinates };
export type { BoardCoord };

export interface BoardInputCallbacks {
  /** Paints a cell on the active layer (annotation or board) with the picked colour. */
  onPen?: (x: number, y: number, color: string) => void;
  /** Erases a cell from the active layer (also used for right-drag erasing). */
  onErase?: (x: number, y: number) => void;
  onFloodErase?: (x: number, y: number) => void;
  onRectFill?: (x1: number, y1: number, x2: number, y2: number, color: string) => void;
  annotationTool: AnnotationTool;
  annotationColor: string;
  isDrawing: boolean;
  onDrawingStart?: () => void;
  onDrawingEnd?: () => void;
  /** Reports each cell painted by the current stroke, for stroke auto-color. */
  onStrokeCell?: (x: number, y: number) => void;
  cellSize?: number;
  /** Live engine state, so the press can tell an occupied cell from a blank one. */
  state?: EngineState;
  /** Which layer the pointer mutates: 'blocks' or 'annotations'. */
  editMode?: EditMode;
}

type PointerEvt =
  | React.MouseEvent<HTMLCanvasElement>
  | React.TouchEvent<HTMLCanvasElement>;

/** True when the active layer already has content at (x, y). */
function isCellOccupied(callbacks: BoardInputCallbacks, x: number, y: number): boolean {
  if (!callbacks.state) return false;
  const layer = callbacks.editMode === 'blocks' ? callbacks.state.board : callbacks.state.annotations;
  const row = layer[y];
  return row ? row[x] !== 0 : false;
}

export function useBoardInput(
  canvasRef: RefObject<HTMLCanvasElement>,
  callbacks: BoardInputCallbacks,
) {
  const [rectStart, setRectStart] = useState<BoardCoord | null>(null);
  const lastCell = useRef<BoardCoord | null>(null);
  // Right-drag (and tap-on-occupied) erase regardless of the selected tool;
  // latched on press so the whole drag keeps erasing even though mousemove
  // reports no button.
  const erasing = useRef(false);
  // Right-drag on the rect tool floods the connected blob instead of stroking
  // single cells, so the fill tool can also undo whole regions at once.
  const floodErasing = useRef(false);

  const cellSize = callbacks.cellSize ?? BOARD_CELL_SIZE;

  const coordsOf = (e: PointerEvt): BoardCoord | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return getCanvasCoordinates(canvas, e, cellSize);
  };

  const paint = (x: number, y: number) => {
    callbacks.onPen?.(x, y, callbacks.annotationColor);
    callbacks.onStrokeCell?.(x, y);
  };

  const handleMouseDown = (e: PointerEvt) => {
    const { onPen, onErase, onFloodErase, onRectFill } = callbacks;
    if (!onPen && !onErase && !onFloodErase && !onRectFill) return;
    const coords = coordsOf(e);
    if (!coords) return;
    lastCell.current = coords;

    // Begin the stroke before the first paint so the stroke recorder never
    // loses the origin cell.
    callbacks.onDrawingStart?.();

    if (isRightButton(e) && callbacks.annotationTool === 'rect') {
      // Rect fill is a carving tool; right-clicking it floods the blob under
      // the cursor instead of erasing a single cell.
      floodErasing.current = true;
      onFloodErase?.(coords.x, coords.y);
      return;
    }

    erasing.current = isRightButton(e);

    // Starting a pen stroke on an occupied cell removes it instead of painting
    // over it. Touch screens have no right button, so this is the only way to
    // carve existing content (matches fourtris).
    if (!erasing.current && callbacks.annotationTool === 'pen' && isCellOccupied(callbacks, coords.x, coords.y)) {
      erasing.current = true;
      onErase?.(coords.x, coords.y);
      return;
    }

    if (erasing.current) {
      onErase?.(coords.x, coords.y);
      return;
    }

    if (callbacks.annotationTool === 'pen' && onPen) {
      paint(coords.x, coords.y);
    } else if (callbacks.annotationTool === 'erase' && onErase) {
      onErase(coords.x, coords.y);
    } else if (callbacks.annotationTool === 'floodErase' && onFloodErase) {
      onFloodErase(coords.x, coords.y);
    } else if (callbacks.annotationTool === 'rect' && onRectFill) {
      setRectStart(coords);
    }
  };

  const handleMouseMove = (e: PointerEvt) => {
    if (!callbacks.isDrawing || !lastCell.current) return;
    const coords = coordsOf(e);
    if (!coords) return;
    const from = lastCell.current;
    const { annotationTool, annotationColor } = callbacks;

    const eraseAlong = (fn: (x: number, y: number) => void) => {
      for (const [cx, cy] of walkLineCells(from.x, from.y, coords.x, coords.y)) {
        fn(cx, cy);
      }
    };

    if (floodErasing.current && callbacks.onFloodErase) {
      eraseAlong(callbacks.onFloodErase);
    } else if (erasing.current && callbacks.onErase) {
      eraseAlong(callbacks.onErase);
    } else if (annotationTool === 'pen' && callbacks.onPen) {
      eraseAlong(paint);
    } else if (annotationTool === 'erase' && callbacks.onErase) {
      eraseAlong(callbacks.onErase);
    } else if (annotationTool === 'rect' && rectStart && callbacks.onRectFill) {
      callbacks.onRectFill(rectStart.x, rectStart.y, coords.x, coords.y, annotationColor);
    }
    lastCell.current = coords;
  };

  const handleMouseUp = (e: PointerEvt) => {
    if (!callbacks.isDrawing) return;
    if (!erasing.current && callbacks.annotationTool === 'rect' && rectStart && callbacks.onRectFill) {
      const coords = coordsOf(e);
      if (coords) {
        callbacks.onRectFill(
          rectStart.x,
          rectStart.y,
          coords.x,
          coords.y,
          callbacks.annotationColor,
        );
      }
      setRectStart(null);
    }
    lastCell.current = null;
    erasing.current = false;
    floodErasing.current = false;
    callbacks.onDrawingEnd?.();
  };

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
