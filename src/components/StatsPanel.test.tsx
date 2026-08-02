import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsPanel } from './StatsPanel';
import { GameStats, DEFAULT_GAME_STATS } from '../engine/types';

function createMockStats(overrides: Partial<GameStats> = {}): GameStats {
  return {
    ...DEFAULT_GAME_STATS,
    ...overrides,
  };
}

describe('StatsPanel', () => {
  it('renders all enabled stat rows (PPS, APM, KPP, APP, TIME, Pieces, Finesse)', () => {
    const stats = createMockStats({ pps: 1.5, time: 30, piecesPlaced: 42, efficiency: 0.45 });
    render(<StatsPanel stats={stats} cellSize={20} />);
    expect(screen.getByText('PPS')).toBeInTheDocument();
    expect(screen.getByText('APM')).toBeInTheDocument();
    expect(screen.getByText('KPP')).toBeInTheDocument();
    expect(screen.getByText('APP')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Attack')).toBeInTheDocument();
    expect(screen.getByText('Pieces')).toBeInTheDocument();
    expect(screen.getByText('Finesse')).toBeInTheDocument();

    expect(screen.getByText('1.50')).toBeInTheDocument();
    expect(screen.getByText('0:30')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('0.45')).toBeInTheDocument();
  });

  it('formats time as MM:SS', () => {
    const stats = createMockStats({ time: 125 });
    render(<StatsPanel stats={stats} cellSize={20} />);
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('removes old stat rows (Lines, Singles, Doubles, Triples, Quads, T-Spins, T-Minis, Efficiency)', () => {
    const stats = createMockStats({ linesCleared: 10, singles: 3, doubles: 2, triples: 1, quads: 4, tSpins: 5 });
    render(<StatsPanel stats={stats} cellSize={20} />);
    expect(screen.queryByText('Lines')).not.toBeInTheDocument();
    expect(screen.queryByText('Singles')).not.toBeInTheDocument();
    expect(screen.queryByText('Doubles')).not.toBeInTheDocument();
    expect(screen.queryByText('Triples')).not.toBeInTheDocument();
    expect(screen.queryByText('Quads')).not.toBeInTheDocument();
    expect(screen.queryByText('T-Spins')).not.toBeInTheDocument();
    expect(screen.queryByText('T-Minis')).not.toBeInTheDocument();
    expect(screen.queryByText('Efficiency')).not.toBeInTheDocument();
  });

  it('does not render a STATS header', () => {
    render(<StatsPanel stats={createMockStats()} cellSize={20} />);
    expect(screen.queryByText('STATS')).not.toBeInTheDocument();
  });

  it('scales font size proportionally to cellSize', () => {
    const { rerender } = render(<StatsPanel stats={createMockStats()} cellSize={30} />);
    expect(screen.getByTestId('stats-panel').style.fontSize).toBe('21px');

    rerender(<StatsPanel stats={createMockStats()} cellSize={8} />);
    expect(screen.getByTestId('stats-panel').style.fontSize).toBe('8px');

    rerender(<StatsPanel stats={createMockStats()} cellSize={64} />);
    expect(screen.getByTestId('stats-panel').style.fontSize).toBe('22px');
  });
});