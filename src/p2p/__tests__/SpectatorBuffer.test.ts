import { describe, it, expect } from 'vitest';
import { SpectatorBuffer, INTERPOLATION_DELAY_MS } from '../SpectatorBuffer';
import type { SpectatorPayload } from '../../engine/types/instance';

function makePayload(overrides: Partial<SpectatorPayload> = {}): SpectatorPayload {
  return {
    userId: 'user1',
    matrix: [],
    activePiece: null,
    queue: [],
    hold: null,
    annotations: [],
    stats: { pps: 0, apm: 0, kpp: 0, piecesPlaced: 0, linesCleared: 0 },
    ...overrides,
  };
}

describe('SpectatorBuffer', () => {
  it('returns empty state (hasData: false) when no data pushed', () => {
    const buffer = new SpectatorBuffer();
    const state = buffer.getInterpolatedState(1000);
    expect(state.hasData).toBe(false);
  });

  it('stores and returns data after push', () => {
    const buffer = new SpectatorBuffer();
    const payload = makePayload({ userId: 'user1', queue: [1, 2] });
    buffer.push(payload, 100);
    const state = buffer.getInterpolatedState(1000);
    expect(state.hasData).toBe(true);
    expect(state.userId).toBe('user1');
    expect(state.queue).toEqual([1, 2]);
  });

  it('returns snapshot directly when only one snapshot exists', () => {
    const buffer = new SpectatorBuffer();
    const payload = makePayload({
      userId: 'user1',
      activePiece: { type: 1, x: 3, y: 20, r: 0 },
    });
    buffer.push(payload, 100);
    const state = buffer.getInterpolatedState(200);
    expect(state.hasData).toBe(true);
    expect(state.activePiece).toEqual({ type: 1, x: 3, y: 20, r: 0 });
  });

  it('interpolates active piece x,y position between two snapshots (alpha=0.5)', () => {
    const buffer = new SpectatorBuffer();
    buffer.push(
      makePayload({
        userId: 'user1',
        activePiece: { type: 1, x: 3, y: 20, r: 0 },
      }),
      0
    );
    buffer.push(
      makePayload({
        userId: 'user1',
        activePiece: { type: 1, x: 5, y: 22, r: 0 },
      }),
      50
    );
    const now = INTERPOLATION_DELAY_MS + 25;
    const state = buffer.getInterpolatedState(now);
    expect(state.hasData).toBe(true);
    expect(state.activePiece).not.toBeNull();
    expect(state.activePiece!.x).toBe(4);
    expect(state.activePiece!.y).toBe(21);
  });

  it('uses older snapshot (s1) for discrete state during interpolation', () => {
    const buffer = new SpectatorBuffer();
    buffer.push(
      makePayload({
        userId: 'user1',
        matrix: [[1]],
        queue: [1, 2],
        hold: 3,
        activePiece: { type: 1, x: 3, y: 20, r: 0 },
      }),
      0
    );
    buffer.push(
      makePayload({
        userId: 'user1',
        matrix: [[2]],
        queue: [4, 5],
        hold: 6,
        activePiece: { type: 1, x: 5, y: 22, r: 0 },
      }),
      50
    );
    const now = INTERPOLATION_DELAY_MS + 25;
    const state = buffer.getInterpolatedState(now);
    expect(state.matrix).toEqual([[1]]);
    expect(state.queue).toEqual([1, 2]);
    expect(state.hold).toBe(3);
  });

  it('uses newer snapshot entirely when active piece type changes between snapshots', () => {
    const buffer = new SpectatorBuffer();
    buffer.push(
      makePayload({
        userId: 'user1',
        matrix: [[1]],
        queue: [1],
        hold: 1,
        activePiece: { type: 1, x: 3, y: 20, r: 0 },
      }),
      0
    );
    buffer.push(
      makePayload({
        userId: 'user1',
        matrix: [[2]],
        queue: [2],
        hold: 2,
        activePiece: { type: 2, x: 5, y: 22, r: 1 },
      }),
      50
    );
    const now = 50 + INTERPOLATION_DELAY_MS + 25;
    const state = buffer.getInterpolatedState(now);
    expect(state.matrix).toEqual([[2]]);
    expect(state.queue).toEqual([2]);
    expect(state.hold).toBe(2);
    expect(state.activePiece).toEqual({ type: 2, x: 5, y: 22, r: 1 });
  });

  it('clears old snapshots when a new userId is pushed', () => {
    const buffer = new SpectatorBuffer();
    buffer.push(makePayload({ userId: 'user1', queue: [1] }), 0);
    buffer.push(makePayload({ userId: 'user1', queue: [2] }), 50);
    buffer.push(makePayload({ userId: 'user2', queue: [3] }), 100);
    expect(buffer.getUserId()).toBe('user2');
    expect(buffer.hasData()).toBe(true);
    const state = buffer.getInterpolatedState(200);
    expect(state.userId).toBe('user2');
    expect(state.queue).toEqual([3]);
  });

  it('clear() removes all snapshots and resets userId', () => {
    const buffer = new SpectatorBuffer();
    buffer.push(makePayload({ userId: 'user1' }), 0);
    buffer.clear();
    expect(buffer.hasData()).toBe(false);
    expect(buffer.getUserId()).toBeNull();
    const state = buffer.getInterpolatedState(1000);
    expect(state.hasData).toBe(false);
  });

  it('clamps to first snapshot when renderTime is before all snapshots', () => {
    const buffer = new SpectatorBuffer();
    buffer.push(
      makePayload({
        userId: 'user1',
        queue: [1],
        activePiece: { type: 1, x: 3, y: 20, r: 0 },
      }),
      200
    );
    buffer.push(
      makePayload({
        userId: 'user1',
        queue: [2],
        activePiece: { type: 1, x: 5, y: 22, r: 0 },
      }),
      250
    );
    const now = 210;
    const state = buffer.getInterpolatedState(now);
    expect(state.hasData).toBe(true);
    expect(state.queue).toEqual([1]);
    expect(state.activePiece).toEqual({ type: 1, x: 3, y: 20, r: 0 });
  });

  it('uses latest snapshot when renderTime is after all snapshots', () => {
    const buffer = new SpectatorBuffer();
    buffer.push(makePayload({ userId: 'user1', queue: [1] }), 0);
    buffer.push(makePayload({ userId: 'user1', queue: [2] }), 50);
    const now = 200;
    const state = buffer.getInterpolatedState(now);
    expect(state.hasData).toBe(true);
    expect(state.queue).toEqual([2]);
  });

  it('hasData() returns false initially, true after push', () => {
    const buffer = new SpectatorBuffer();
    expect(buffer.hasData()).toBe(false);
    buffer.push(makePayload({ userId: 'user1' }), 0);
    expect(buffer.hasData()).toBe(true);
  });

  it('getUserId() returns the current userId', () => {
    const buffer = new SpectatorBuffer();
    expect(buffer.getUserId()).toBeNull();
    buffer.push(makePayload({ userId: 'user1' }), 0);
    expect(buffer.getUserId()).toBe('user1');
  });

  it('ignores payloads from users other than the set target', () => {
    const buffer = new SpectatorBuffer();
    buffer.setTarget('user1');
    buffer.push(makePayload({ userId: 'user2', queue: [9] }), 0);
    expect(buffer.hasData()).toBe(false);
    buffer.push(makePayload({ userId: 'user1', queue: [1, 2] }), 10);
    expect(buffer.hasData()).toBe(true);
    expect(buffer.getUserId()).toBe('user1');
    expect(buffer.getInterpolatedState(200).queue).toEqual([1, 2]);
  });

  it('clears snapshots when the target is cleared', () => {
    const buffer = new SpectatorBuffer();
    buffer.setTarget('user1');
    buffer.push(makePayload({ userId: 'user1', queue: [1] }), 0);
    expect(buffer.hasData()).toBe(true);
    buffer.setTarget(null);
    expect(buffer.hasData()).toBe(false);
  });
});
