import { AnnotationMatrix, AnnotationEvent, BoardEditEvent } from './types';
import { InputEvent } from './interfaces/IEngineCore';
import {
  applyAnnotationPen,
  applyAnnotationErase,
  applyAnnotationRectFill,
  applyAnnotationFloodErase,
  clearAllAnnotations,
} from './annotationEngine';
import {
  applyBoardPen,
  applyBoardErase,
  applyBoardRectFill,
  applyBoardFloodErase,
} from './boardEditEngine';
import { registerPaletteColor, PALETTE_CELL_OFFSET } from './annotationPalette';

export function isAnnotationEvent(input: InputEvent): input is AnnotationEvent {
  return input.type.startsWith('ANNOTATE');
}

export function isBoardEditEvent(input: InputEvent): input is BoardEditEvent {
  return input.type.startsWith('BOARD');
}

export interface LayerReduction {
  layer: number[][];
  userPalette: string[];
}

export function reduceAnnotationEvent(
  annotations: AnnotationMatrix,
  userPalette: string[],
  event: AnnotationEvent,
): LayerReduction {
  switch (event.type) {
    case 'ANNOTATE_PEN': {
      const registration = registerPaletteColor(userPalette, event.color);
      return {
        layer: applyAnnotationPen(annotations, event.x, event.y, PALETTE_CELL_OFFSET + registration.index),
        userPalette: registration.userPalette,
      };
    }
    case 'ANNOTATE_ERASE':
      return { layer: applyAnnotationErase(annotations, event.x, event.y), userPalette };
    case 'ANNOTATE_FLOOD_ERASE':
      return { layer: applyAnnotationFloodErase(annotations, event.x, event.y), userPalette };
    case 'ANNOTATE_RECT_FILL': {
      const registration = registerPaletteColor(userPalette, event.color);
      return {
        layer: applyAnnotationRectFill(
          annotations,
          event.x1,
          event.y1,
          event.x2,
          event.y2,
          PALETTE_CELL_OFFSET + registration.index,
        ),
        userPalette: registration.userPalette,
      };
    }
    case 'ANNOTATE_CLEAR_ALL':
      return { layer: clearAllAnnotations(annotations), userPalette };
  }
}

export function reduceBoardEditEvent(
  board: number[][],
  userPalette: string[],
  event: BoardEditEvent,
): LayerReduction {
  switch (event.type) {
    case 'BOARD_PEN': {
      const registration = registerPaletteColor(userPalette, event.color);
      return {
        layer: applyBoardPen(board, event.x, event.y, PALETTE_CELL_OFFSET + registration.index),
        userPalette: registration.userPalette,
      };
    }
    case 'BOARD_ERASE':
      return { layer: applyBoardErase(board, event.x, event.y), userPalette };
    case 'BOARD_FLOOD_ERASE':
      return { layer: applyBoardFloodErase(board, event.x, event.y), userPalette };
    case 'BOARD_RECT_FILL': {
      const registration = registerPaletteColor(userPalette, event.color);
      return {
        layer: applyBoardRectFill(
          board,
          event.x1,
          event.y1,
          event.x2,
          event.y2,
          PALETTE_CELL_OFFSET + registration.index,
        ),
        userPalette: registration.userPalette,
      };
    }
  }
}
