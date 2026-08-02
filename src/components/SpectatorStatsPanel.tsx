import { useEffect, useRef, useState } from 'react';
import type { SpectatorBuffer } from '../p2p/SpectatorBuffer';
import { StatsPanel } from './StatsPanel';
import { DEFAULT_GAME_STATS } from '../engine/types';
import type { GameStats } from '../engine/types';

export function SpectatorStatsPanel({ buffer }: { buffer: SpectatorBuffer }) {
  const [stats, setStats] = useState<GameStats>(DEFAULT_GAME_STATS);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    function tick(now: number) {
      if (!active) return;
      const state = buffer.getInterpolatedState(now);
      setStats(state.stats);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [buffer]);

  return <StatsPanel stats={stats} cellSize={20} />;
}
