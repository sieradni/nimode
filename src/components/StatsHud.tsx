import { GameStats } from '../engine/types';

interface StatsHudProps {
  stats: GameStats;
}

interface StatItem {
  label: string;
  key: keyof GameStats;
  format: 'int' | 'decimal';
}

const STATS: StatItem[] = [
  { label: 'PPS', key: 'pps', format: 'decimal' },
  { label: 'APM', key: 'apm', format: 'decimal' },
  { label: 'KPP', key: 'kpp', format: 'decimal' },
  { label: 'Lines', key: 'linesCleared', format: 'int' },
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

function formatValue(value: number, format: 'int' | 'decimal'): string {
  if (format === 'int') return Math.round(value).toString();
  return value.toFixed(2);
}

export function StatsHud({ stats }: StatsHudProps) {
  return (
    <div className="bg-slate-900/85 border border-slate-700 rounded-lg p-4 w-56">
      <h3 className="text-sm font-bold text-sky-400 mb-3">Statistics</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {STATS.map((item) => (
          <div key={item.key} className="flex justify-between text-xs">
            <span className="text-slate-300">{item.label}</span>
            <span className="text-cyan-400 font-mono">{formatValue(stats[item.key], item.format)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
