import type { SpectatorPayload } from '../engine/types/game';

export const INTERPOLATION_DELAY_MS = 50;
export const MAX_SNAPSHOTS = 128;

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
  stats: SpectatorPayload['stats'];
  hasData: boolean;
}

function emptyStats(): SpectatorPayload['stats'] {
  return { pps: 0, apm: 0, kpp: 0, piecesPlaced: 0, linesCleared: 0 };
}

function toInterpolatedState(payload: SpectatorPayload): InterpolatedState {
  return {
    userId: payload.userId,
    matrix: payload.matrix,
    activePiece: payload.activePiece,
    queue: payload.queue,
    hold: payload.hold,
    annotations: payload.annotations,
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

  getInterpolatedState(now: number): InterpolatedState {
    if (this.snapshots.length === 0) {
      return {
        userId: this.userId ?? '',
        matrix: [],
        activePiece: null,
        queue: [],
        hold: null,
        annotations: [],
        stats: emptyStats(),
        hasData: false,
      };
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
      stats: s1.payload.stats,
      hasData: true,
    };
  }
}
