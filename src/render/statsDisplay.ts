import { GameStats } from '../engine/types';

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface StatRow {
  label: string;
  getValue: (stats: GameStats) => string;
}

export const STAT_ROWS: StatRow[] = [
  { label: 'PPS', getValue: (s) => s.pps.toFixed(2) },
  { label: 'APM', getValue: (s) => s.apm.toFixed(2) },
  { label: 'Attack', getValue: (s) => s.attack.toString() },
  { label: 'KPP', getValue: (s) => s.kpp.toFixed(2) },
  { label: 'APP', getValue: (s) => s.efficiency.toFixed(2) },
  { label: 'Time', getValue: (s) => formatTime(s.time) },
  { label: 'Pieces', getValue: (s) => s.piecesPlaced.toString() },
  { label: 'Finesse', getValue: (s) => s.finesse.toString() },
];
