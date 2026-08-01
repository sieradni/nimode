import { useEffect, useRef, useState } from 'react';
import type { SpectatorBuffer } from '../p2p/SpectatorBuffer';
import { StatsPanel } from './StatsPanel';
import type { GameStats } from '../engine/types';

function toGameStats(s: { pps: number; apm: number; kpp: number; piecesPlaced: number; linesCleared: number }): GameStats {
  return {
    pps: s.pps,
    apm: s.apm,
    kpp: s.kpp,
    piecesPlaced: s.piecesPlaced,
    linesCleared: s.linesCleared,
    singles: 0,
    doubles: 0,
    triples: 0,
    quads: 0,
    tSpins: 0,
    tSpinMinis: 0,
    finesse: 0,
    efficiency: 0,
    attack: 0,
  };
}

export function SpectatorStatsPanel({ buffer }: { buffer: SpectatorBuffer }) {
  const [stats, setStats] = useState<GameStats>(toGameStats({ pps: 0, apm: 0, kpp: 0, piecesPlaced: 0, linesCleared: 0 }));
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    function tick(now: number) {
      if (!active) return;
      const state = buffer.getInterpolatedState(now);
      setStats(toGameStats(state.stats));
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [buffer]);

  return <StatsPanel stats={stats} />;
}