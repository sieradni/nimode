export type AnnotationTool = 'pen' | 'erase' | 'floodErase' | 'rect';

/** Which layer the pointer tools mutate: free-form marks or real board blocks. */
export type EditMode = 'annotations' | 'blocks';

export type AnnotationMatrix = number[][];

export type AnnotationEvent =
  | { type: 'ANNOTATE_PEN'; x: number; y: number; color: string }
  | { type: 'ANNOTATE_ERASE'; x: number; y: number }
  | { type: 'ANNOTATE_FLOOD_ERASE'; x: number; y: number }
  | { type: 'ANNOTATE_RECT_FILL'; x1: number; y1: number; x2: number; y2: number; color: string }
  | { type: 'ANNOTATE_CLEAR_ALL' };

export type BoardEditEvent =
  | { type: 'BOARD_PEN'; x: number; y: number; color: string }
  | { type: 'BOARD_ERASE'; x: number; y: number }
  | { type: 'BOARD_FLOOD_ERASE'; x: number; y: number }
  | { type: 'BOARD_RECT_FILL'; x1: number; y1: number; x2: number; y2: number; color: string };
