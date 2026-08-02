import { GameState } from './types';
import { InputEvent } from './interfaces/IEngineCore';
import { InputHandler } from './inputHandler';
import { PlayerStats } from './playerStats';

/**
 * Applies gameplay inputs (movement, rotations, hold, undo, reset, ...) and
 * records the input statistics they produce. Grouped here (instead of inside
 * EngineCore) to keep the core engine file within the line budget and to
 * mirror the edit-input handling in `editInputHandler.ts`.
 */
export function handleGameInput(
  state: GameState,
  input: InputEvent,
  inputHandler: InputHandler,
  playerStats: PlayerStats,
): void {
  inputHandler.handleInput(input);
  if (!state.activePiece) return;
  const isRotation =
    input.type === 'ROTATE_CW' || input.type === 'ROTATE_CCW' || input.type === 'ROTATE_180';
  if ((input.type === 'MOVE_LEFT' || input.type === 'MOVE_RIGHT') && input.pressed) {
    playerStats.recordInput('move');
  } else if (isRotation) {
    playerStats.recordInput('rotate');
  }
}
