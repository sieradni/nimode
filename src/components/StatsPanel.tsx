import { GameStats } from '../engine/types';
import { STAT_ROWS } from '../render/statsDisplay';

interface StatsPanelProps {
  stats: GameStats;
  cellSize?: number;
}

function computeFontSize(cellSize: number): number {
  return Math.max(8, Math.min(22, cellSize * 0.7));
}

export function StatsPanel({ stats, cellSize = 30 }: StatsPanelProps) {
  const fontSize = computeFontSize(cellSize);

  return (
    <div data-testid="stats-panel" style={{ fontSize: `${fontSize}px` }}>
      <div className="space-y-1">
        {STAT_ROWS.map((row) => (
          <div key={row.label} className="flex justify-between">
            <span className="truncate">{row.label}</span>
            <span className="font-mono truncate ml-2">{row.getValue(stats)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}