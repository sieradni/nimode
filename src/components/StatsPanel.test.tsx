import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsPanel } from './StatsPanel';
import { GameStats } from '../engine/types';

function createMockStats(overrides: Partial<GameStats> = {}): GameStats {
  return {
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
    ...overrides,
  };
}

describe('StatsPanel', () => {
  it('renders stats panel with all stat rows', () => {
    const stats = createMockStats({ pps: 1.5, linesCleared: 10 });
    render(<StatsPanel stats={stats} cellSize={20} />);
    expect(screen.getByText('STATS')).toBeInTheDocument();
    expect(screen.getByText('PPS')).toBeInTheDocument();
    expect(screen.getByText('1.50')).toBeInTheDocument();
    expect(screen.getByText('Lines')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('formats decimal stats correctly', () => {
    const stats = createMockStats({ pps: 1.234, apm: 25.6, kpp: 0.8, finesse: 0.95 });
    render(<StatsPanel stats={stats} cellSize={20} />);
    expect(screen.getByText('1.23')).toBeInTheDocument();
    expect(screen.getByText('25.60')).toBeInTheDocument();
    expect(screen.getByText('0.80')).toBeInTheDocument();
    expect(screen.getByText('0.95')).toBeInTheDocument();
  });

  it('formats integer stats correctly', () => {
    const stats = createMockStats({ linesCleared: 42, attack: 100 });
    render(<StatsPanel stats={stats} cellSize={20} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders panel with correct styling', () => {
    render(<StatsPanel stats={createMockStats()} cellSize={20} />);
    const panel = screen.getByText('STATS').closest('div');
    expect(panel).toHaveClass('bg-slate-900');
    expect(panel).toHaveClass('border-slate-700');
    expect(panel).toHaveClass('rounded-lg');
  });
});