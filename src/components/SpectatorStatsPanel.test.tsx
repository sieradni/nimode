import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SpectatorStatsPanel } from './SpectatorStatsPanel';
import { SpectatorBuffer } from '@/p2p/SpectatorBuffer';
import { DEFAULT_GAME_STATS } from '@/engine/types';

vi.useFakeTimers();

describe('SpectatorStatsPanel', () => {
  let buffer: SpectatorBuffer;

  beforeEach(() => {
    buffer = new SpectatorBuffer();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useFakeTimers();
  });

  it('renders stats panel with zero stats initially', () => {
    render(<SpectatorStatsPanel buffer={buffer} />);
    expect(screen.getByText('PPS')).toBeInTheDocument();
    const values = screen.getAllByText('0.00');
    expect(values.length).toBeGreaterThan(0);
  });

  it('updates stats when buffer receives new data', () => {
    const { rerender } = render(<SpectatorStatsPanel buffer={buffer} />);

    buffer.push({
      userId: 'test-user',
      matrix: [],
      activePiece: null,
      queue: [],
      hold: null,
      annotations: [],
      userPalette: ['#ffffff'],
      stats: { ...DEFAULT_GAME_STATS, pps: 2.5, apm: 30.5, kpp: 1.2, piecesPlaced: 10, linesCleared: 5 },
    }, Date.now());

    act(() => {
      vi.advanceTimersByTime(16);
    });

    rerender(<SpectatorStatsPanel buffer={buffer} />);

    expect(screen.getByText('2.50')).toBeInTheDocument();
    expect(screen.getByText('30.50')).toBeInTheDocument();
  });

  it('cleans up animation frame on unmount', () => {
    const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame');
    const { unmount } = render(<SpectatorStatsPanel buffer={buffer} />);
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
    cancelSpy.mockRestore();
  });
});
