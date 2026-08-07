import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { EngineState } from '../engine/interfaces/IEngineCore';
import { DEFAULT_GAME_STATS } from '../engine/types';
import { GameCanvas } from './GameCanvas';
import { IEngineCore } from '../engine/interfaces/IEngineCore';

vi.mock('./canvas/useBoardScale', () => ({
  useBoardScale: () => ({ cellSize: 30, compact: true }),
  computePreviewCellSize: (cellSize: number) => Math.max(4, Math.round(cellSize * 0.9)),
  LAYOUT_GAP_PX: 16,
  MIN_CELL_SIZE: 8,
  MAX_CELL_SIZE: 64,
}));
vi.mock('../render/BoardRenderer', () => ({ renderBoard: vi.fn() }));
vi.mock('../render/QueueHoldRenderer', () => ({
  renderQueue: vi.fn(),
  renderHold: vi.fn(),
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
    stats: { ...DEFAULT_GAME_STATS },
    gameOver: false,
    paused: false,
    annotations,
    userPalette: ['#ffffff'],
    bagRemaining: 6,
  };
}

function createMockEngine(): IEngineCore {
  return {
    initialize: vi.fn(),
    updateConfig: vi.fn(),
    tick: vi.fn(),
    handleInput: vi.fn(),
    getState: vi.fn(),
    reset: vi.fn(),
    clearBoard: vi.fn(),
    setQueue: vi.fn(),
    setPaused: vi.fn(),
    undo: vi.fn().mockReturnValue(true),
    redo: vi.fn().mockReturnValue(true),
    canUndo: vi.fn().mockReturnValue(true),
    canRedo: vi.fn().mockReturnValue(true),
  };
}

describe('GameCanvas (compact layout)', () => {
  let mockCtx: CanvasRenderingContext2D;
  const mockEngine = createMockEngine();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {} as unknown as CanvasRenderingContext2D;
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => mockCtx
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  it('hides the stats panel in compact mode', () => {
    render(
      <GameCanvas
        state={createState()}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
        onReset={vi.fn()}
      />
    );
    expect(screen.queryByTestId('stats-panel')).not.toBeInTheDocument();
  });

  it('moves the hold above the queue in the compact column', () => {
    render(
      <GameCanvas
        state={createState()}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
        onReset={vi.fn()}
      />
    );
    expect(screen.getByTestId('hold-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('queue-canvas')).toBeInTheDocument();
  });
});