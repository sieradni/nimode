import { GameStats } from '../engine/types';

interface StatRow {
  label: string;
  key: keyof GameStats;
  format: 'int' | 'decimal';
}

const STATS_ROWS: StatRow[] = [
  { label: 'PPS', key: 'pps', format: 'decimal' },
  { label: 'APM', key: 'apm', format: 'decimal' },
  { label: 'KPP', key: 'kpp', format: 'decimal' },
  { label: 'Lines Cleared', key: 'linesCleared', format: 'int' },
  { label: 'Singles', key: 'singles', format: 'int' },
  { label: 'Doubles', key: 'doubles', format: 'int' },
  { label: 'Triples', key: 'triples', format: 'int' },
  { label: 'Quads', key: 'quads', format: 'int' },
  { label: 'T-Spins', key: 'tSpins', format: 'int' },
  { label: 'T-Spin Minis', key: 'tSpinMinis', format: 'int' },
  { label: 'Attack', key: 'attack', format: 'int' },
  { label: 'Efficiency', key: 'efficiency', format: 'decimal' },
  { label: 'Finesse', key: 'finesse', format: 'decimal' },
];

const PADDING = 10;
const ROW_HEIGHT = 18;
const FONT_SIZE = 13;

function formatValue(value: number, format: 'int' | 'decimal'): string {
  if (format === 'int') return Math.round(value).toString();
  return value.toFixed(2);
}

export function renderStatsOverlay(
  ctx: CanvasRenderingContext2D,
  stats: GameStats,
  width: number,
  height: number
): void {
  void height;
  const panelWidth = 180;
  const panelHeight = STATS_ROWS.length * ROW_HEIGHT + PADDING * 2;
  const x = width - panelWidth - PADDING;
  const y = PADDING;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(x, y, panelWidth, panelHeight);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, panelWidth, panelHeight);

  ctx.font = `${FONT_SIZE}px monospace`;
  ctx.textBaseline = 'top';

  for (let i = 0; i < STATS_ROWS.length; i++) {
    const row = STATS_ROWS[i]!;
    const rowY = y + PADDING + i * ROW_HEIGHT;

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(row.label, x + PADDING, rowY);

    ctx.fillStyle = '#22d3ee';
    ctx.textAlign = 'right';
    ctx.fillText(formatValue(stats[row.key], row.format), x + panelWidth - PADDING, rowY);
  }
}
