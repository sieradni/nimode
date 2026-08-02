export interface InstanceConfig {
  isPrivate: boolean;
}

export const DEFAULT_INSTANCE_CONFIG: InstanceConfig = {
  isPrivate: false,
};

export interface SpectatorPayload {
  userId: string;
  matrix: number[][];
  activePiece: { type: number; x: number; y: number; r: number } | null;
  queue: number[];
  hold: number | null;
  annotations: number[][];
  userPalette: string[];
  stats: {
    pps: number;
    apm: number;
    kpp: number;
    piecesPlaced: number;
    linesCleared: number;
  };
}