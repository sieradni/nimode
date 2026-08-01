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
}

export interface PlayerStatsSnapshot {
  pps: number;
  apm: number;
  kpp: number;
  piecesPlaced: number;
  linesCleared: number;
  singles: number;
  doubles: number;
  triples: number;
  quads: number;
  tSpins: number;
  tSpinMinis: number;
  finesse: number;
  efficiency: number;
  attack: number;
}