import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EngineState } from '../engine/interfaces/IEngineCore';
import { DEFAULT_GAME_STATS } from '../engine/types';

const { mockInit, mockHandleInput, mockTick, mockGetState } = vi.hoisted(() => ({
  mockInit: vi.fn(),
  mockHandleInput: vi.fn(),
  mockTick: vi.fn(),
  mockGetState: vi.fn(),
}));

vi.mock('../discord/sdk', () => ({
  createDiscordSdk: vi.fn(() => ({
    clientId: 'test-client-id',
    init: mockInit,
  })),
}));

vi.mock('../engine/EngineCore', () => ({
  EngineCore: vi.fn().mockImplementation(() => ({
    handleInput: mockHandleInput,
    tick: mockTick,
    getState: mockGetState,
    updateConfig: vi.fn(),
  })),
}));

import App from '../App';

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
  };
}

function dispatchKey(type: 'keydown' | 'keyup', code: string, repeat = false): void {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true, repeat }));
}

describe('App keyboard wiring', () => {
  beforeEach(() => {
    import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';
    mockInit.mockResolvedValue({});
    mockHandleInput.mockReset();
    mockTick.mockReset();
    mockGetState.mockReturnValue(createState());
  });

  it('routes held keydown through keybindingsStore to engine.handleInput', () => {
    render(<App />);
    dispatchKey('keydown', 'ArrowLeft');
    expect(mockHandleInput).toHaveBeenCalledWith({ type: 'MOVE_LEFT', pressed: true });
  });

  it('routes held keyup as a released input', () => {
    render(<App />);
    dispatchKey('keyup', 'ArrowDown');
    expect(mockHandleInput).toHaveBeenCalledWith({ type: 'SOFT_DROP', pressed: false });
  });

  it('routes one-time actions only on keydown', () => {
    render(<App />);
    dispatchKey('keydown', 'Space');
    expect(mockHandleInput).toHaveBeenCalledWith({ type: 'HARD_DROP' });
    mockHandleInput.mockClear();
    dispatchKey('keyup', 'Space');
    expect(mockHandleInput).not.toHaveBeenCalled();
  });

   it('routes rotate actions via custom bindings', () => {
     render(<App />);
     dispatchKey('keydown', 'KeyX');
     expect(mockHandleInput).toHaveBeenCalledWith({ type: 'ROTATE_CW' });
   });

  it('ignores unbound keys', () => {
    render(<App />);
    dispatchKey('keydown', 'KeyQ');
    expect(mockHandleInput).not.toHaveBeenCalled();
  });

  it('disables game input while the settings modal is open', async () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    dispatchKey('keydown', 'ArrowLeft');
    expect(mockHandleInput).not.toHaveBeenCalled();
  });
});
