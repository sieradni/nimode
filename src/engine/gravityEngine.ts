import { GameState, GameConfig } from './types';
import { movePiece, lockPiece } from './engineActions';
import { IRotationSystem } from './interfaces/IRotationSystem';
import { IBagRandomizer } from './interfaces/IBagRandomizer';

export function applyGravityToState(
  state: GameState,
  config: GameConfig,
  gravityTimer: number,
  dt: number,
  bagRandomizer: IBagRandomizer,
  rotationSystem: IRotationSystem,
  onLock: (linesCleared: number) => void,
): number {
  if (!state.activePiece) return gravityTimer;
  if (config.gravity === 0) return gravityTimer;

  if (config.gravity >= 20) {
    while (movePiece(state, 0, -1)) {
      // piece is falling under 20G gravity
    }
    if (!config.subzero) {
      onLock(lockPiece(state, bagRandomizer, rotationSystem));
    }
    return 0;
  }

  let timer = gravityTimer + dt;
  const gravityRate = 1000 / (60 * config.gravity);

  while (timer >= gravityRate) {
    if (!movePiece(state, 0, -1)) {
      if (!config.subzero) {
        onLock(lockPiece(state, bagRandomizer, rotationSystem));
      }
      return 0;
    }
    timer -= gravityRate;
  }
  return timer;
}
