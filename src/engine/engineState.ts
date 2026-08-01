import { GameState, GameConfig, DEFAULT_CONFIG, EMPTY_INPUT_STATE } from './types';
import { IBagRandomizer } from './interfaces/IBagRandomizer';
import { createEmptyBoard } from './boardUtils';
import { createEmptyAnnotations } from './annotationEngine';

export function createInitialGameState(
  randomizer: IBagRandomizer,
  config: GameConfig = DEFAULT_CONFIG
): GameState {
  return {
    board: createEmptyBoard(),
    activePiece: null,
    queue: {
      queue: randomizer.peek(7),
      hold: null,
      canHold: true,
    },
    config: { ...config },
    inputState: { ...EMPTY_INPUT_STATE },
    dasCounters: { left: 0, right: 0, down: 0 },
    arrCounters: { left: 0, right: 0 },
    gameOver: false,
    paused: false,
    annotations: createEmptyAnnotations(),
  };
}
