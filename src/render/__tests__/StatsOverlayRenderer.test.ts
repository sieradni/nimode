import { describe, it, expect, vi } from 'vitest';
import { renderStatsOverlay } from '../StatsOverlayRenderer';
import { GameStats, DEFAULT_GAME_STATS } from '../../engine/types';

const MOCK_STATS: GameStats = {
  ...DEFAULT_GAME_STATS,
  piecesPlaced: 42,
  pps: 1.5,
  apm: 25.3,
  kpp: 0.8,
  efficiency: 0.45,
  attack: 15,
  time: 125,
};

type MockCtx = CanvasRenderingContext2D & {
  fillRect: ReturnType<typeof vi.fn>;
  strokeRect: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
};

function createMockCtx(): MockCtx {
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
  } as unknown as MockCtx;
}

describe('StatsOverlayRenderer', () => {
  it('should render without throwing given valid stats and canvas', () => {
    const ctx = createMockCtx();
    expect(() => renderStatsOverlay(ctx, MOCK_STATS, 400, 300)).not.toThrow();
  });

  it('should render a panel with fillRect and strokeRect', () => {
    const ctx = createMockCtx();
    renderStatsOverlay(ctx, MOCK_STATS, 400, 300);
    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
    expect(ctx.strokeRect).toHaveBeenCalledTimes(1);
  });

  it('should render stat rows with labels and values', () => {
    const ctx = createMockCtx();
    renderStatsOverlay(ctx, MOCK_STATS, 400, 300);
    const texts = ctx.fillText.mock.calls.map((call: unknown[]) => call[0] as string);

    expect(texts).toContain('PPS:');
    expect(texts).toContain('APM:');
    expect(texts).toContain('Attack:');
    expect(texts).toContain('KPP:');
    expect(texts).toContain('APP:');
    expect(texts).toContain('Time:');
    expect(texts).toContain('Pieces:');
    expect(texts).toContain('Finesse:');
  });

  it('should not render old removed stats', () => {
    const ctx = createMockCtx();
    renderStatsOverlay(ctx, MOCK_STATS, 400, 300);
    const texts = ctx.fillText.mock.calls.map((call: unknown[]) => call[0] as string);

    expect(texts).not.toContain('Lines:');
    expect(texts).not.toContain('Singles:');
    expect(texts).not.toContain('Doubles:');
    expect(texts).not.toContain('Triples:');
    expect(texts).not.toContain('Quads:');
    expect(texts).not.toContain('T-Spins:');
    expect(texts).not.toContain('T-Minis:');
    expect(texts).not.toContain('Efficiency:');
  });

  it('should render time value as formatted MM:SS', () => {
    const ctx = createMockCtx();
    renderStatsOverlay(ctx, MOCK_STATS, 400, 300);
    const valueTexts = ctx.fillText.mock.calls.map((call: unknown[]) => call[0] as string);
    expect(valueTexts).toContain('2:05');
  });
});
