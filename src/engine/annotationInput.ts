import { AnnotationMatrix } from './types';
import { InputEvent } from './interfaces/IEngineCore';
import { applyAnnotationPen, applyAnnotationErase, applyAnnotationRectFill, clearAllAnnotations } from './annotationEngine';
import { autoColorAnnotations } from './autoColorEngine';

export type AnnotationEvent =
  | { type: 'ANNOTATE_PEN'; x: number; y: number; pieceType: number }
  | { type: 'ANNOTATE_ERASE'; x: number; y: number }
  | { type: 'ANNOTATE_RECT_FILL'; x1: number; y1: number; x2: number; y2: number; pieceType: number }
  | { type: 'ANNOTATE_CLEAR_ALL' }
  | { type: 'ANNOTATE_AUTO_COLOR' };

export function isAnnotationEvent(input: InputEvent): input is AnnotationEvent {
  return input.type.startsWith('ANNOTATE');
}

export function reduceAnnotationEvent(
  annotations: AnnotationMatrix,
  event: AnnotationEvent
): AnnotationMatrix {
  switch (event.type) {
    case 'ANNOTATE_PEN':
      return applyAnnotationPen(annotations, event.x, event.y, event.pieceType);
    case 'ANNOTATE_ERASE':
      return applyAnnotationErase(annotations, event.x, event.y);
    case 'ANNOTATE_RECT_FILL':
      return applyAnnotationRectFill(annotations, event.x1, event.y1, event.x2, event.y2, event.pieceType);
    case 'ANNOTATE_CLEAR_ALL':
      return clearAllAnnotations(annotations);
    case 'ANNOTATE_AUTO_COLOR':
      return autoColorAnnotations(annotations);
  }
}
