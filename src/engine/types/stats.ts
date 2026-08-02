export interface GameStats {
  piecesPlaced: number;
  linesCleared: number;
  singles: number;
  doubles: number;
  triples: number;
  quads: number;
  tSpins: number;
  tSpinMinis: number;
  pps: number;
  apm: number;
  kpp: number;
  finesse: number;
  efficiency: number;
  attack: number;
  time: number;
}

export interface PlayerStatsSnapshot {
  piecesPlaced: number;
  linesCleared: number;
  singles: number;
  doubles: number;
  triples: number;
  quads: number;
  tSpins: number;
  tSpinMinis: number;
  keyPresses: number;
  elapsedMs: number;
  finesse: number;
  attack: number;
  time: number;
  pps: number;
  apm: number;
  kpp: number;
  efficiency: number;
}

export const DEFAULT_GAME_STATS: GameStats = {
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
  time: 0,
};

export const DEFAULT_PLAYER_STATS_SNAPSHOT: PlayerStatsSnapshot = {
  piecesPlaced: 0,
  linesCleared: 0,
  singles: 0,
  doubles: 0,
  triples: 0,
  quads: 0,
  tSpins: 0,
  tSpinMinis: 0,
  keyPresses: 0,
  elapsedMs: 0,
  finesse: 0,
  attack: 0,
  time: 0,
  pps: 0,
  apm: 0,
  kpp: 0,
  efficiency: 0,
};