import {
  GameState,
  GameStats,
  GameConfig,
  DEFAULT_CONFIG,
  EMPTY_INPUT_STATE,
} from './types';
import { IBagRandomizer } from './interfaces/IBagRandomizer';
import { createEmptyBoard } from './boardUtils';

export const INITIAL_STATS: GameStats = {
  piecesPlaced: 0,
  linesCleared: 0,
  singles: 0,
  doubles: 0,
  triples: 0,
  quads: 0,
  tSpins: 0,
  tSpinMinis: 0,
  pps: 0,
  apm: 0,
  kpp: 0,
  finesse: 0,
  efficiency: 0,
  attack: 0,
};

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
    stats: { ...INITIAL_STATS },
    config: { ...config },
    inputState: { ...EMPTY_INPUT_STATE },
    dasCounters: { left: 0, right: 0, down: 0 },
    arrCounters: { left: 0, right: 0 },
    gameOver: false,
    paused: false,
  };
}

export function updateStatsOnLineClear(stats: GameStats, linesCleared: number): GameStats {
  if (linesCleared === 0) return stats;

  const newStats = { ...stats, linesCleared: stats.linesCleared + linesCleared };
  switch (linesCleared) {
    case 1:
      newStats.singles++;
      break;
    case 2:
      newStats.doubles++;
      break;
    case 3:
      newStats.triples++;
      break;
    case 4:
      newStats.quads++;
      break;
  }
  return newStats;
}
