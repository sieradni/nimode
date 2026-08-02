import { describe, it, expect, vi } from 'vitest';
import { renderBoard } from '../BoardRenderer';
import { GHOST_COLOR, GHOST_LINE_WIDTH, FIELD_DIVIDER_COLOR, FIELD_DIVIDER_WIDTH } from '../renderConstants';
import { RENDER_BUFFER_ROWS, RENDER_TOP_Y } from '../../engine/types';

interface StrokeRectCall { x: number; y: number; w: number; h: number; strokeStyle: string; lineWidth: number }
interface FillRectCall { x: number; y: number; w: number; h: number; fillStyle: string }
interface LineCall { from: [number, number]; to: [number, number] }

function createMockCtx() {
  const strokeRects: StrokeRectCall[] = [];
  const fillRects: FillRectCall[] = [];
  const lines: LineCall[] = [];
  let pending: [number, number] = [0, 0];
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
      fillRects.push({ x, y, w, h, fillStyle: String(ctx.fillStyle) });
    }),
    strokeRect: vi.fn((x: number, y: number, w: number, h: number) => {
      strokeRects.push({ x, y, w, h, strokeStyle: String(ctx.strokeStyle), lineWidth: ctx.lineWidth });
    }),
    beginPath: vi.fn(),
    moveTo: vi.fn((x: number, y: number) => { pending = [x, y]; }),
    lineTo: vi.fn((x: number, y: number) => { lines.push({ from: pending, to: [x, y] }); }),
    stroke: vi.fn(),
    clearRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  return { ctx, strokeRects, fillRects, lines };
}

const emptyBoard = () => Array(40).fill(null).map(() => Array(10).fill(0));

const CELL = 30;

describe('BoardRenderer spawn area visibility', () => {
  it('renders the O-piece spawned at row 18 (above visible field)', () => {
    const { ctx, fillRects } = createMockCtx();
    // O-piece spawns at y=18 (spawnOffset=1). Its cells are at rows 18-19,
    // entirely above the visible field (row 20+). It must still be drawn.
    const activePiece = { type: 4 as const, x: 4, y: 18, rotation: 0 as const };

    renderBoard(ctx, emptyBoard(), activePiece, emptyBoard(), { cellSize: CELL });

    // The O-piece fills its cells with the piece colour; filter out background fills.
    const pieceCells = fillRects.filter(c => c.w === CELL && c.h === CELL && c.fillStyle !== '#0f0f1a' && c.fillStyle !== '#1a1a2e');
    expect(pieceCells.length).toBe(4);
  });

  it('renders the I-piece spawned at row 18 with top cells in buffer area', () => {
    const { ctx, fillRects } = createMockCtx();
    // I-piece spawns at y=18. Row 1 (board y=19) has the 4 cells, all in the
    // buffer area (row 19 < 20).
    const activePiece = { type: 1 as const, x: 3, y: 18, rotation: 0 as const };

    renderBoard(ctx, emptyBoard(), activePiece, emptyBoard(), { cellSize: CELL });

    // All 4 I-piece cells at board row 19 (screen sy = (19 - RENDER_TOP_Y) * CELL)
    const expectedSy = (19 - RENDER_TOP_Y) * CELL;
    const pieceCells = fillRects.filter(c => c.w === CELL && c.h === CELL && Math.abs(c.y - expectedSy) < 0.01);
    expect(pieceCells.length).toBe(4);
  });

  it('draws a divider line at the buffer/visible boundary', () => {
    const { ctx, lines } = createMockCtx();
    renderBoard(ctx, emptyBoard(), null, emptyBoard(), { cellSize: CELL });

    const dividerY = RENDER_BUFFER_ROWS * CELL + 0.5; // crisp() result
    const dividerLine = lines.find(l => {
      const y = l.from[1];
      return Math.abs(y - dividerY) < 0.01;
    });
    expect(dividerLine).toBeDefined();
  });

  it('exports valid divider constants', () => {
    expect(FIELD_DIVIDER_COLOR).toBeDefined();
    expect(FIELD_DIVIDER_WIDTH).toBeGreaterThanOrEqual(1);
  });
});

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
