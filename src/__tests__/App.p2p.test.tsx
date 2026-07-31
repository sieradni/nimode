import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { DiscordAuth } from '../discord/types';
import type { SpectatorPayload } from '../engine/types/game';
import { instanceConfigStore } from '../p2p/InstanceConfigStore';

const { mockInit, mockCreatePeer, mockPeer, mockConn, connHandlers, peerHandlers } = vi.hoisted(() => {
  const peerHandlers: Record<string, Array<(...args: unknown[]) => void>> = {};
  const connHandlers: Record<string, Array<(...args: unknown[]) => void>> = {};

  const mockConn = {
    peer: 'remote-peer',
    metadata: {} as Record<string, unknown>,
    open: true,
    send: vi.fn<[payload: SpectatorPayload], void>(),
    close: vi.fn(),
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      (connHandlers[event] ??= []).push(cb);
    }),
    _emit: (event: string, ...args: unknown[]) => {
      connHandlers[event]?.forEach((cb) => cb(...args));
    },
  };

  const mockPeer = {
    id: 'instance-1',
    open: true,
    destroyed: false,
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      (peerHandlers[event] ??= []).push(cb);
    }),
    connect: vi.fn(() => mockConn),
    destroy: vi.fn(),
    _emit: (event: string, ...args: unknown[]) => {
      peerHandlers[event]?.forEach((cb) => cb(...args));
    },
  };

  return {
    mockInit: vi.fn(),
    mockCreatePeer: vi.fn(() => mockPeer),
    mockPeer,
    mockConn,
    connHandlers,
    peerHandlers,
  };
});

vi.mock('../discord/sdk', () => ({
  createDiscordSdk: vi.fn(() => ({
    clientId: 'test-client-id',
    init: mockInit,
  })),
}));

vi.mock('../p2p/peerFactory', () => ({
  createPeerJSInstance: mockCreatePeer,
}));

import App from '../App';

const AUTH: DiscordAuth = {
  userId: 'user-123',
  guildId: 'guild-1',
  channelId: 'channel-1',
  instanceId: 'instance-1',
};

const STUN_SERVERS = ['stun:stun.l.google.com:19302'];

function makePayload(): SpectatorPayload {
  return {
    userId: 'remote-1',
    matrix: Array.from({ length: 40 }, () => Array(10).fill(0)),
    activePiece: null,
    queue: [],
    hold: null,
    annotations: [],
    stats: { pps: 3.2, apm: 40, kpp: 1.5, piecesPlaced: 10, linesCleared: 2 },
  };
}

async function flushAuth(): Promise<void> {
  await act(async () => {});
  await act(async () => {});
}

describe('App P2P integration', () => {
  beforeEach(() => {
    import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';
    mockInit.mockReset();
    mockInit.mockResolvedValue(AUTH);
    mockCreatePeer.mockReset();
    mockCreatePeer.mockReturnValue(mockPeer);
    mockConn.send.mockReset();
    mockConn.close.mockReset();
    mockPeer.connect.mockReset();
    mockPeer.destroy.mockReset();
    mockConn.metadata = {};
    Object.keys(peerHandlers).forEach((key) => delete peerHandlers[key]);
    Object.keys(connHandlers).forEach((key) => delete connHandlers[key]);
    instanceConfigStore.setPrivate(false);
  });

  afterEach(() => {
    delete import.meta.env.VITE_DISCORD_CLIENT_ID;
  });

  it('creates a host Peer with the Discord instance id when authenticated', async () => {
    render(<App />);
    await flushAuth();

    expect(mockCreatePeer).toHaveBeenCalledWith('instance-1', STUN_SERVERS);
  });

  it('broadcasts engine state at 20Hz once the peer opens', async () => {
    vi.useFakeTimers();
    try {
      render(<App />);
      await flushAuth();

      mockConn.metadata = { userId: 'remote-1', displayName: 'Alice', isPrivate: false };
      act(() => mockPeer._emit('open', 'instance-1'));
      act(() => mockPeer._emit('connection', mockConn));
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(mockConn.send).toHaveBeenCalled();
      const sentPayload = mockConn.send.mock.calls[0]?.[0];
      expect(sentPayload?.userId).toBe('user-123');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not broadcast when the instance is private', async () => {
    vi.useFakeTimers();
    try {
      render(<App />);
      await flushAuth();

      mockConn.metadata = { userId: 'remote-1', displayName: 'Alice', isPrivate: false };
      act(() => mockPeer._emit('open', 'instance-1'));
      act(() => instanceConfigStore.setPrivate(true));
      act(() => mockPeer._emit('connection', mockConn));
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockConn.send).not.toHaveBeenCalled();
    } finally {
      act(() => instanceConfigStore.setPrivate(false));
      vi.useRealTimers();
    }
  });

  it('renders the spectator board and returns to local board', async () => {
    render(<App />);
    await flushAuth();

    mockConn.metadata = { userId: 'remote-1', displayName: 'Alice', isPrivate: false };
    act(() => mockPeer._emit('connection', mockConn));

    expect(screen.getByTestId('board-canvas')).toBeInTheDocument();
    const spectateButton = await screen.findByRole('button', { name: /spectate/i });
    fireEvent.click(spectateButton);

    expect(await screen.findByTestId('spectator-canvas')).toBeInTheDocument();
    expect(screen.queryByTestId('board-canvas')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /return to my board/i }));
    expect(await screen.findByTestId('board-canvas')).toBeInTheDocument();
    expect(screen.queryByTestId('spectator-canvas')).toBeNull();
  });

  it('blocks spectating a private participant', async () => {
    render(<App />);
    await flushAuth();

    mockConn.metadata = { userId: 'remote-1', displayName: 'Alice', isPrivate: true };
    act(() => mockPeer._emit('connection', mockConn));

    expect(screen.getByTestId('board-canvas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /spectate/i })).toBeNull();
  });

  it('feeds incoming spectator payloads into the buffer for rendering', async () => {
    render(<App />);
    await flushAuth();

    mockConn.metadata = { userId: 'remote-1', displayName: 'Alice', isPrivate: false };
    act(() => mockPeer._emit('connection', mockConn));
    fireEvent.click(await screen.findByRole('button', { name: /spectate/i }));
    expect(await screen.findByTestId('spectator-canvas')).toBeInTheDocument();

    act(() => mockConn._emit('data', makePayload()));
    expect(screen.getByTestId('spectator-canvas')).toBeInTheDocument();
  });
});
