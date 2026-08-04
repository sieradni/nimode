import type { SpectatorPayload } from '../engine/types/instance';
import { GameStats, DEFAULT_GAME_STATS } from '../engine/types';

export const INTERPOLATION_DELAY_MS = 20;
export const MAX_SNAPSHOTS = 128;
/**
 * Snapshots older than this are treated as stale: `getInterpolatedState`
 * reports `hasData: false` so the renderer can stop replaying a disconnected
 * host's last frame instead of showing an increasingly-out-of-date board.
 *
 * Tuned to tolerate several missed 500ms polls (transient network hiccups)
 * while detecting a genuinely-quiet host within a couple of seconds.
 */
export const DATA_STALE_MS = 2000;

export interface TimestampedSnapshot {
  payload: SpectatorPayload;
  receivedAt: number;
}

export interface InterpolatedState {
  userId: string;
  matrix: number[][];
  activePiece: { type: number; x: number; y: number; r: number } | null;
  queue: number[];
  hold: number | null;
  annotations: number[][];
  userPalette: string[];
  stats: GameStats;
  hasData: boolean;
}

function toInterpolatedState(payload: SpectatorPayload): InterpolatedState {
  return {
    userId: payload.userId,
    matrix: payload.matrix,
    activePiece: payload.activePiece,
    queue: payload.queue,
    hold: payload.hold,
    annotations: payload.annotations,
    userPalette: payload.userPalette,
    stats: payload.stats,
    hasData: true,
  };
}

export class SpectatorBuffer {
  private snapshots: TimestampedSnapshot[] = [];
  private userId: string | null = null;
  private targetUserId: string | null = null;

  setTarget(userId: string | null): void {
    this.targetUserId = userId;
    if (userId === null) {
      this.clear();
    }
  }

  push(payload: SpectatorPayload, receivedAt: number): void {
    if (this.targetUserId !== null && payload.userId !== this.targetUserId) {
      return;
    }
    if (payload.userId !== this.userId) {
      this.snapshots = [];
      this.userId = payload.userId;
    }
    this.snapshots.push({ payload, receivedAt });
    while (this.snapshots.length > MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }
  }

  clear(): void {
    this.snapshots = [];
    this.userId = null;
  }

  getUserId(): string | null {
    return this.userId;
  }

  hasData(): boolean {
    return this.snapshots.length > 0;
  }

  private emptyState(): InterpolatedState {
    return {
      userId: this.userId ?? '',
      matrix: [],
      activePiece: null,
      queue: [],
      hold: null,
      annotations: [],
      userPalette: [],
      stats: { ...DEFAULT_GAME_STATS },
      hasData: false,
    };
  }

  getInterpolatedState(now: number): InterpolatedState {
    if (this.snapshots.length === 0) {
      return this.emptyState();
    }

    const newest = this.snapshots[this.snapshots.length - 1]!;
    // Stale-gate: when the most recent snapshot is older than the freshness
    // window, the host can be considered quiet/disconnected. Don't replay an
    // increasingly-stale board — surface no data so the view can degrade
    // gracefully instead of showing old snapshots.
    if (now - newest.receivedAt > DATA_STALE_MS) {
      return this.emptyState();
    }

    const renderTime = now - INTERPOLATION_DELAY_MS;

    let s1: TimestampedSnapshot | null = null;
    let s2: TimestampedSnapshot | null = null;

    for (let i = 0; i < this.snapshots.length; i++) {
      const snap = this.snapshots[i]!;
      if (snap.receivedAt <= renderTime) {
        s1 = snap;
      } else {
        s2 = snap;
        break;
      }
    }

    if (s1 === null) {
      return toInterpolatedState(this.snapshots[0]!.payload);
    }

    if (s2 === null) {
      return toInterpolatedState(s1.payload);
    }

    const p1 = s1.payload.activePiece;
    const p2 = s2.payload.activePiece;

    if (p1 === null || p2 === null || p1.type !== p2.type) {
      return toInterpolatedState(s2.payload);
    }

    const delta = s2.receivedAt - s1.receivedAt;
    if (delta <= 0) {
      return toInterpolatedState(s1.payload);
    }

    const alpha = (renderTime - s1.receivedAt) / delta;
    const interpolatedActivePiece = {
      type: p1.type,
      x: p1.x + (p2.x - p1.x) * alpha,
      y: p1.y + (p2.y - p1.y) * alpha,
      r: p1.r,
    };

    return {
      userId: s1.payload.userId,
      matrix: s1.payload.matrix,
      activePiece: interpolatedActivePiece,
      queue: s1.payload.queue,
      hold: s1.payload.hold,
      annotations: s1.payload.annotations,
      userPalette: s1.payload.userPalette,
      stats: s1.payload.stats,
      hasData: true,
    };
  }
}
