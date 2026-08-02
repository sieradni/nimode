import { GameStats } from '../engine/types';
import { STAT_ROWS } from './statsDisplay';

const PADDING = 10;
const ROW_HEIGHT = 18;
const FONT_SIZE = 13;
const PANEL_WIDTH = 120;

export function renderStatsOverlay(
  ctx: CanvasRenderingContext2D,
  stats: GameStats,
  width: number,
  height: number
): void {
  const panelHeight = STAT_ROWS.length * ROW_HEIGHT + PADDING * 2;
  const x = Math.max(PADDING, width - PANEL_WIDTH - PADDING);
  const y = Math.max(PADDING, Math.floor((height - panelHeight) / 2));

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(x, y, PANEL_WIDTH, panelHeight);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, PANEL_WIDTH, panelHeight);

  ctx.font = `${FONT_SIZE}px monospace`;
  ctx.textBaseline = 'top';

  for (let i = 0; i < STAT_ROWS.length; i++) {
    const row = STAT_ROWS[i]!;
    const rowY = y + PADDING + i * ROW_HEIGHT;

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(row.label + ':', x + PADDING, rowY);

    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'right';
    const raw = row.getValue(stats);
    const display = raw.length > 10 ? raw.slice(0, 9) + '…' : raw;
    ctx.fillText(display, x + PANEL_WIDTH - PADDING, rowY);
  }
}
