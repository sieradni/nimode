import { GameStats } from '../engine/types';

interface StatRow {
  label: string;
  getValue: (stats: GameStats) => string;
}

const STAT_ROWS: StatRow[] = [
  { label: 'PPS', getValue: (s) => s.pps.toFixed(2) },
  { label: 'APM', getValue: (s) => s.apm.toFixed(2) },
  { label: 'KPP', getValue: (s) => s.kpp.toFixed(2) },
  { label: 'Lines', getValue: (s) => Math.round(s.linesCleared).toString() },
  { label: 'Singles', getValue: (s) => Math.round(s.singles).toString() },
  { label: 'Doubles', getValue: (s) => Math.round(s.doubles).toString() },
  { label: 'Triples', getValue: (s) => Math.round(s.triples).toString() },
  { label: 'Quads', getValue: (s) => Math.round(s.quads).toString() },
  { label: 'T-Spins', getValue: (s) => Math.round(s.tSpins).toString() },
  { label: 'T-Minis', getValue: (s) => Math.round(s.tSpinMinis).toString() },
  { label: 'Attack', getValue: (s) => Math.round(s.attack).toString() },
  { label: 'Finesse', getValue: (s) => s.finesse.toFixed(2) },
];

export function StatsPanel({ stats }: { stats: GameStats }) {
  return (
    <div className="w-40 flex-shrink-0 bg-slate-900 border border-slate-700 rounded-lg p-3">
      <h2 className="text-sm font-semibold mb-2 text-slate-400">STATS</h2>
      <div className="space-y-1">
        {STAT_ROWS.map((row) => (
          <div key={row.label} className="flex justify-between text-xs">
            <span className="text-slate-400">{row.label}</span>
            <span className="text-slate-200 font-mono">{row.getValue(stats)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}