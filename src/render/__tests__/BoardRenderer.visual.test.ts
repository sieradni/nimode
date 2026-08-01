import { describe, it, expect, vi } from 'vitest';
import { renderBoard } from '../BoardRenderer';
import { GHOST_COLOR, GHOST_LINE_WIDTH } from '../renderConstants';

interface StrokeRectCall { x: number; y: number; w: number; h: number; strokeStyle: string; lineWidth: number }
interface LineCall { from: [number, number]; to: [number, number] }

function createMockCtx() {
  const strokeRects: StrokeRectCall[] = [];
  const lines: LineCall[] = [];
  let pending: [number, number] = [0, 0];
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    fillRect: vi.fn(),
    strokeRect: vi.fn((x: number, y: number, w: number, h: number) => {
      strokeRects.push({ x, y, w, h, strokeStyle: String(ctx.strokeStyle), lineWidth: ctx.lineWidth });
    }),
    beginPath: vi.fn(),
    moveTo: vi.fn((x: number, y: number) => { pending = [x, y]; }),
    lineTo: vi.fn((x: number, y: number) => { lines.push({ from: pending, to: [x, y] }); }),
    stroke: vi.fn(),
    clearRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  return { ctx, strokeRects, lines };
}

const emptyBoard = () => Array(40).fill(null).map(() => Array(10).fill(0));

describe('BoardRenderer ghost piece', () => {
  it('draws the ghost in white rather than the piece colour', () => {
    const { ctx, strokeRects } = createMockCtx();
    // A T piece high above the floor so a ghost is drawn beneath it.
    const activePiece = { type: 6 as const, x: 3, y: 22, rotation: 0 as const };

    renderBoard(ctx, emptyBoard(), activePiece, emptyBoard());

    const ghostStrokes = strokeRects.filter(s => s.strokeStyle === GHOST_COLOR);
    expect(ghostStrokes.length).toBeGreaterThan(0);
  });

  it('draws the ghost with a thick outline', () => {
    const { ctx, strokeRects } = createMockCtx();
    const activePiece = { type: 6 as const, x: 3, y: 22, rotation: 0 as const };

    renderBoard(ctx, emptyBoard(), activePiece, emptyBoard());

    const ghostStrokes = strokeRects.filter(s => s.strokeStyle === GHOST_COLOR);
    for (const s of ghostStrokes) {
      expect(s.lineWidth).toBe(GHOST_LINE_WIDTH);
    }
    expect(GHOST_LINE_WIDTH).toBeGreaterThanOrEqual(3);
  });

  it('renders the ghost fully opaque so the white reads clearly', () => {
    const { ctx } = createMockCtx();
    const activePiece = { type: 6 as const, x: 3, y: 22, rotation: 0 as const };

    renderBoard(ctx, emptyBoard(), activePiece, emptyBoard());

    expect(ctx.globalAlpha).toBe(1);
  });
});

describe('BoardRenderer crisp grid lines', () => {
  it('places 1px grid lines on half-pixel centres to avoid blurring', () => {
    const { ctx, lines } = createMockCtx();

    renderBoard(ctx, emptyBoard(), null, emptyBoard(), { cellSize: 30 });

    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      const vertical = line.from[0] === line.to[0];
      const coord = vertical ? line.from[0] : line.from[1];
      // Every gridline must sit on a .5 boundary so it maps onto one device
      // pixel rather than straddling two.
      expect(Math.abs(coord % 1)).toBeCloseTo(0.5);
    }
  });
});
