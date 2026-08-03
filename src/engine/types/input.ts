export type InputAction =
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'SOFT_DROP'
  | 'HARD_DROP'
  | 'ROTATE_CW'
  | 'ROTATE_CCW'
  | 'ROTATE_180'
  | 'HOLD'
  | 'RESET'
  | 'UNDO'
  | 'REDO';

export interface InputState {
  left: boolean;
  right: boolean;
  down: boolean;
  hardDrop: boolean;
  cw: boolean;
  ccw: boolean;
  rotate180: boolean;
  hold: boolean;
  clearHold: boolean;
  reset: boolean;
  undo: boolean;
  redo: boolean;
}

export const EMPTY_INPUT_STATE: InputState = {
  left: false,
  right: false,
  down: false,
  hardDrop: false,
  cw: false,
  ccw: false,
  rotate180: false,
  hold: false,
  clearHold: false,
  reset: false,
  undo: false,
  redo: false,
};