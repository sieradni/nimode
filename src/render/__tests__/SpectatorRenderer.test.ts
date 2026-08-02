import { describe, it, expect, vi } from 'vitest';
import { renderSpectatorState } from '../SpectatorRenderer';
import type { InterpolatedState } from '../../p2p/SpectatorBuffer';
import { PIECE_COLORS } from '../../engine/types';

function createMockCtx() {
  const calls: Record<string, unknown[]> = {};
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    font: '',
    textBaseline: '',
    textAlign: '',
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
      (calls.fillRect ??= []).push({ x, y, w, h, fillStyle: ctx.fillStyle });
    }),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D & { calls: Record<string, unknown[]> };
  Object.assign(ctx, { calls });
  return ctx;
}

function makeEmptyState(overrides: Partial<InterpolatedState> = {}): InterpolatedState {
  return {
    userId: 'user1',
    matrix: [],
    activePiece: null,
    queue: [],
    hold: null,
    annotations: [],
    userPalette: ['#ffffff'],
    stats: { pps: 0, apm: 0, kpp: 0, piecesPlaced: 0, linesCleared: 0 },
    hasData: false,
    ...overrides,
  };
}

function makeBoardMatrix(): number[][] {
  return Array(40).fill(null).map(() => Array(10).fill(0));
}

describe('SpectatorRenderer', () => {
  it('does not render (no fillRect calls) when hasData is false', () => {
    const ctx = createMockCtx();
    renderSpectatorState(ctx, makeEmptyState({ hasData: false }));
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('renders board without throwing when hasData is true', () => {
    const ctx = createMockCtx();
    const state = makeEmptyState({
      hasData: true,
      matrix: makeBoardMatrix(),
      activePiece: { type: 6, x: 3, y: 36, r: 0 },
      queue: [1, 2],
      hold: 3,
      stats: { pps: 1.5, apm: 25, kpp: 1.2, piecesPlaced: 42, linesCleared: 7 },
    });
    expect(() => renderSpectatorState(ctx, state)).not.toThrow();
  });

  it('renders annotations on top of the board (verify fillRect called for annotation positions)', () => {
    const ctx = createMockCtx();
    const annotations = makeBoardMatrix();
    const iPieceCell = 1;
    const jPieceCell = 2;
    annotations[20]![0] = iPieceCell;
    annotations[25]![5] = jPieceCell;
    const state = makeEmptyState({
      hasData: true,
      matrix: makeBoardMatrix(),
      annotations,
    });
    renderSpectatorState(ctx, state, { boardCellSize: 30 });
    const calls = ctx.calls;
    const iPieceCalls = (calls.fillRect as unknown[])
      .filter((c) => (c as Record<string, unknown>).fillStyle === PIECE_COLORS[iPieceCell]);
    const jPieceCalls = (calls.fillRect as unknown[])
      .filter((c) => (c as Record<string, unknown>).fillStyle === PIECE_COLORS[jPieceCell]);
    expect(iPieceCalls.length).toBeGreaterThanOrEqual(1);
    expect(jPieceCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('renders without active piece (null) without throwing', () => {
    const ctx = createMockCtx();
    const state = makeEmptyState({
      hasData: true,
      matrix: makeBoardMatrix(),
      activePiece: null,
    });
    expect(() => renderSpectatorState(ctx, state)).not.toThrow();
  });

  it('renders with empty queue and null hold without throwing', () => {
    const ctx = createMockCtx();
    const state = makeEmptyState({
      hasData: true,
      matrix: makeBoardMatrix(),
      activePiece: null,
      queue: [],
      hold: null,
    });
    expect(() => renderSpectatorState(ctx, state)).not.toThrow();
  });
});
