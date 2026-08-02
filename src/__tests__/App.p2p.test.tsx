import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { DiscordAuth } from '../discord/types';
import type { SpectatorPayload } from '../engine/types/instance';
import { DEFAULT_GAME_STATS } from '../engine/types';
import { instanceConfigStore } from '../p2p/InstanceConfigStore';

const { mockInit, mockGetParticipants, mockCreatePeer, mockPeer, mockConn, connHandlers, peerHandlers } =
  vi.hoisted(() => {
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
    mockGetParticipants: vi.fn(),
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
    getInstanceConnectedParticipants: mockGetParticipants,
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
  accessToken: 'test-access-token',
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
    userPalette: ['#ffffff'],
    stats: { ...DEFAULT_GAME_STATS, pps: 3.2, apm: 40, kpp: 1.5, piecesPlaced: 10, linesCleared: 2 },
  };
}

async function flushAuth(): Promise<void> {
  await act(async () => {});
  await act(async () => {});
  try {
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
  } catch {
    // Timers not available in real-timer mode
  }
}

describe('App P2P integration', () => {
  beforeEach(() => {
    import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';
    mockInit.mockReset();
    mockInit.mockResolvedValue(AUTH);
    mockGetParticipants.mockReset();
    mockGetParticipants.mockResolvedValue([]);
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

  it('creates a host Peer with a unique per-user id when authenticated', async () => {
    render(<App />);
    await flushAuth();

    expect(mockCreatePeer).toHaveBeenCalledWith('instance-1-user-123', STUN_SERVERS);
  });

  it('broadcasts engine state at 50Hz once the peer opens', async () => {
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
      const stateCall = mockConn.send.mock.calls.find((call) => {
        const message = call[0] as { userId?: string } | undefined;
        return typeof message === 'object' && message !== null && message.userId === 'user-123';
      });
      expect(stateCall).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not broadcast state when the instance is private but still sends presence', async () => {
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

      const stateCalls = mockConn.send.mock.calls.filter((call) => {
        const message = call[0] as { matrix?: unknown } | undefined;
        return typeof message === 'object' && message !== null && 'matrix' in message;
      });
      expect(stateCalls).toHaveLength(0);

      const presenceCalls = mockConn.send.mock.calls.filter((call) => {
        const message = call[0] as { kind?: string } | undefined;
        return typeof message === 'object' && message !== null && message.kind === 'presence';
      });
      // The last presence call should reflect the private instance config
      const presenceCall = presenceCalls[presenceCalls.length - 1];
      expect(presenceCall?.[0]).toEqual({
        kind: 'presence',
        metadata: { userId: 'user-123', displayName: 'user-123', isPrivate: true },
      });
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

  it('opens an outbound connection to the spectated target peer', async () => {
    mockPeer.connect.mockReturnValue(mockConn);
    render(<App />);
    await flushAuth();

    mockConn.metadata = { userId: 'remote-1', displayName: 'Alice', isPrivate: false };
    act(() => mockPeer._emit('open', 'instance-1-user-123'));
    act(() => mockPeer._emit('connection', mockConn));
    fireEvent.click(await screen.findByRole('button', { name: /spectate/i }));

    expect(mockPeer.connect).toHaveBeenCalledWith(
      'instance-1-remote-1',
      expect.objectContaining({ metadata: expect.objectContaining({ userId: 'user-123' }) })
    );
  });

  it('discovers instance participants and lets the user spectate them', async () => {
    mockPeer.connect.mockReturnValue(mockConn);
    mockGetParticipants.mockResolvedValue([
      { id: 'remote-2', username: 'remote-two', displayName: 'Bob' },
      { id: 'user-123', username: 'self', displayName: 'Self' },
    ]);
    render(<App />);
    await flushAuth();
    act(() => mockPeer._emit('open', 'instance-1-user-123'));

    expect(await screen.findByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Self')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /spectate/i }));
    expect(await screen.findByTestId('spectator-canvas')).toBeInTheDocument();
    expect(mockPeer.connect).toHaveBeenCalledWith(
      'instance-1-remote-2',
      expect.anything()
    );
  });

  it('exchanges presence proactively so a Private participant shows as unavailable before spectating', async () => {
    mockPeer.connect.mockReturnValue(mockConn);
    mockGetParticipants.mockResolvedValue([
      { id: 'remote-2', username: 'remote-two', displayName: 'Bob' },
      { id: 'user-123', username: 'self', displayName: 'Self' },
    ]);
    render(<App />);
    await flushAuth();
    act(() => mockPeer._emit('open', 'instance-1-user-123'));

    expect(await screen.findByText('Bob')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /spectate/i })).toBeInTheDocument();

    act(() =>
      mockConn._emit('data', {
        kind: 'presence',
        metadata: { userId: 'remote-2', displayName: 'Bob', isPrivate: true },
      }),
    );

    expect(screen.queryByRole('button', { name: /spectate/i })).toBeNull();
    expect(screen.getByText(/private/i)).toBeInTheDocument();
  });
});
