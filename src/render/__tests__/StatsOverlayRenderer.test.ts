import { describe, it, expect, vi } from 'vitest';
import { renderStatsOverlay } from '../StatsOverlayRenderer';
import { GameStats } from '../../engine/types';

const MOCK_STATS: GameStats = {
  piecesPlaced: 42,
  linesCleared: 10,
  singles: 4,
  doubles: 3,
  triples: 2,
  quads: 1,
  tSpins: 2,
  tSpinMinis: 1,
  pps: 1.5,
  apm: 25.3,
  kpp: 0.8,
  finesse: 0.95,
  efficiency: 0.45,
  attack: 15,
};

function createMockCtx() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('StatsOverlayRenderer', () => {
  it('should render without throwing given valid stats and canvas', () => {
    const ctx = createMockCtx();
    expect(() => renderStatsOverlay(ctx, MOCK_STATS, 400, 300)).not.toThrow();
  });

  it('should draw text on the canvas', () => {
    const ctx = createMockCtx();
    renderStatsOverlay(ctx, MOCK_STATS, 400, 300);
    expect(ctx.fillText).toHaveBeenCalled();
  });
});
