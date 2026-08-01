import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { EngineState } from '../engine/interfaces/IEngineCore';

const { mockHandleInput } = vi.hoisted(() => ({
  mockHandleInput: vi.fn(),
}));

const { mockView } = vi.hoisted(() => ({
  mockView: { current: 'LOCAL_ACTIVE' },
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
  };
}

vi.mock('../discord/sdk', () => ({
  createDiscordSdk: vi.fn(() => ({
    clientId: 'test-client-id',
    init: vi.fn().mockResolvedValue({}),
  })),
}));

vi.mock('../engine/EngineCore', () => ({
  EngineCore: vi.fn().mockImplementation(() => ({
    handleInput: mockHandleInput,
    tick: vi.fn(),
    getState: vi.fn(() => createState()),
    updateConfig: vi.fn(),
  })),
}));

vi.mock('../p2p/usePeerSession', () => ({
  usePeerSession: () => ({
    peerManager: null,
    spectatorBuffer: null,
    view: mockView.current,
    selectTarget: vi.fn(() => true),
    returnToLocal: vi.fn(),
    connectionError: null,
    participants: [],
  }),
}));

import App from '../App';

function dispatchKey(type: 'keydown' | 'keyup', code: string): void {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

describe('App keyboard gating by view', () => {
  beforeEach(() => {
    import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';
    mockHandleInput.mockReset();
    mockView.current = 'LOCAL_ACTIVE';
  });

  it('forwards keydown to the engine while in LOCAL_ACTIVE', () => {
    render(<App />);
    dispatchKey('keydown', 'ArrowLeft');
    expect(mockHandleInput).toHaveBeenCalledWith({ type: 'MOVE_LEFT', pressed: true });
  });

  it('does not forward keydown to the engine while spectating', () => {
    mockView.current = 'SPECTATING_TARGET';
    render(<App />);
    dispatchKey('keydown', 'ArrowLeft');
    dispatchKey('keydown', 'Space');
    expect(mockHandleInput).not.toHaveBeenCalled();
  });

  it('forwards keydown again after returning to the local board', () => {
    mockView.current = 'SPECTATING_TARGET';
    const { unmount } = render(<App />);
    dispatchKey('keydown', 'Space');
    expect(mockHandleInput).not.toHaveBeenCalled();
    unmount();

    mockView.current = 'LOCAL_ACTIVE';
    render(<App />);
    dispatchKey('keydown', 'Space');
    expect(mockHandleInput).toHaveBeenCalledWith({ type: 'HARD_DROP' });
  });
});
