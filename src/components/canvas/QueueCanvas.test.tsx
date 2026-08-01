import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueueCanvas } from '../canvas/QueueCanvas';
import { EngineState } from '../../engine/interfaces/IEngineCore';
import { renderQueue } from '../../render/QueueHoldRenderer';

vi.mock('../../render/QueueHoldRenderer', () => ({
  renderQueue: vi.fn(),
  QUEUE_PREVIEW_SIZE: 4,
  QUEUE_GAP: 4,
}));

function createState(): EngineState {
  const board = Array.from({ length: 40 }, () => Array(10).fill(0));
  const annotations = Array.from({ length: 40 }, () => Array(10).fill(0));
  return {
    board,
    activePiece: { type: 6, x: 3, y: 36, rotation: 0 },
    queue: [1, 2, 3, 4, 5, 6],
    hold: 7,
    canHold: true,
    stats: {
      piecesPlaced: 0,
      linesCleared: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      quads: 0,
      tSpins: 0,
      tSpinMinis: 0,
      pps: 0,
      apm: 0,
      kpp: 0,
      finesse: 0,
      efficiency: 0,
      attack: 0,
    },
    gameOver: false,
    paused: false,
    annotations,
  } as EngineState;
}

describe('QueueCanvas', () => {
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {} as unknown as CanvasRenderingContext2D;
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => mockCtx
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  it('renders queue canvas', () => {
    render(<QueueCanvas state={createState()} />);
    expect(screen.getByTestId('queue-canvas')).toBeInTheDocument();
  });

  it('sizes the queue canvas to five preview slots plus gaps', () => {
    render(<QueueCanvas state={createState()} />);
    const canvas = screen.getByTestId('queue-canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(4 * 20);
    expect(canvas.height).toBe(5 * 4 * 20 + 4 * 4);
  });

  it('renders the queue sliced to 5 previews', () => {
    const state = createState();
    render(<QueueCanvas state={state} />);
    expect(vi.mocked(renderQueue)).toHaveBeenCalledWith(mockCtx, [1, 2, 3, 4, 5], {
      cellSize: 20,
    });
  });

  it('redraws when a new state object is provided', () => {
    const { rerender } = render(<QueueCanvas state={createState()} />);
    expect(vi.mocked(renderQueue)).toHaveBeenCalledTimes(1);
    rerender(<QueueCanvas state={createState()} />);
    expect(vi.mocked(renderQueue)).toHaveBeenCalledTimes(2);
  });
});