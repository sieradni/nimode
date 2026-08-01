import { GameState, GameConfig, DEFAULT_CONFIG, EMPTY_INPUT_STATE, PieceType } from './types';
import { IBagRandomizer } from './interfaces/IBagRandomizer';
import { createEmptyBoard } from './boardUtils';
import { createEmptyAnnotations } from './annotationEngine';

const INITIAL_QUEUE_SIZE = 6;

export function createInitialGameState(
  randomizer: IBagRandomizer,
  config: GameConfig = DEFAULT_CONFIG
): GameState {
  const initialQueue: PieceType[] = [];
  for (let i = 0; i < INITIAL_QUEUE_SIZE; i++) {
    initialQueue.push(randomizer.pop());
  }
  return {
    board: createEmptyBoard(),
    activePiece: null,
    queue: {
      queue: initialQueue,
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
