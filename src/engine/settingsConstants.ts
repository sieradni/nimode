import { InputAction } from './types';

export const ACTION_LABELS: Record<InputAction, string> = {
  MOVE_LEFT: 'Move Left',
  MOVE_RIGHT: 'Move Right',
  SOFT_DROP: 'Soft Drop',
  HARD_DROP: 'Hard Drop',
  ROTATE_CW: 'Rotate CW',
  ROTATE_CCW: 'Rotate CCW',
  ROTATE_180: 'Rotate 180',
  HOLD: 'Hold',
  CLEAR_HOLD: 'Clear Hold',
  RESET: 'Reset',
  UNDO: 'Undo',
  REDO: 'Redo',
};

export const ALL_ACTIONS: InputAction[] = [
  'MOVE_LEFT', 'MOVE_RIGHT', 'SOFT_DROP', 'HARD_DROP',
  'ROTATE_CW', 'ROTATE_CCW', 'ROTATE_180', 'HOLD', 'CLEAR_HOLD',
  'RESET', 'UNDO', 'REDO',
];
