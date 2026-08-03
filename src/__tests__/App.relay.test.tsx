import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DiscordAuth } from '../discord/types';
import type { EngineState } from '../engine/interfaces/IEngineCore';
import { DEFAULT_GAME_STATS } from '../engine/types';
import type { PeerMetadata } from '../p2p/types';

function makeEngineState(): EngineState {
  const board = Array.from({ length: 40 }, () => Array(10).fill(0));
  const annotations = Array.from({ length: 40 }, () => Array(10).fill(0));
  return {
    board,
    activePiece: null,
    queue: [],
    hold: null,
    canHold: true,
    stats: { ...DEFAULT_GAME_STATS, pps: 0, apm: 0, kpp: 0, piecesPlaced: 0, linesCleared: 0 },
    gameOver: false,
    paused: false,
    annotations,
    userPalette: ['#ffffff'],
    bagRemaining: 7,
  };
}

type Handler = (...args: unknown[]) => void;
type Handlers = Map<string, Handler[]>;

const handlers: Handlers = new Map();

interface MockTransport {
  open: boolean;
  on(event: string, cb: Handler): void;
  off(event: string, cb: Handler): void;
  emit(event: string, ...args: unknown[]): void;
  openTransport: Mock;
  close: Mock;
  sendPresence: Mock;
  broadcast: Mock;
  connectToPeer: Mock;
}

const mockTransport: MockTransport = {
  open: true,
  on: (event: string, cb: Handler) => {
    const arr = handlers.get(event) ?? [];
    arr.push(cb);
    handlers.set(event, arr);
  },
  off: (event: string, cb: Handler) => {
    const arr = handlers.get(event);
    if (arr) handlers.set(event, arr.filter((f) => f !== cb));
  },
  emit: (event: string, ...args: unknown[]) => {
    handlers.get(event)?.forEach((cb) => cb(...args));
  },
  openTransport: vi.fn(() => {
    handlers.get('open')?.forEach((cb) => cb());
    return Promise.resolve();
  }) as Mock,
  close: vi.fn() as Mock,
  sendPresence: vi.fn() as Mock,
  broadcast: vi.fn() as Mock,
  connectToPeer: vi.fn() as Mock,
};

vi.mock('../engine/EngineCore', () => ({
  EngineCore: vi.fn().mockImplementation(() => ({
    handleInput: vi.fn(),
    tick: vi.fn(),
    getState: () => makeEngineState(),
    updateConfig: vi.fn(),
    setPaused: vi.fn(),
  })),
}));

vi.mock('../p2p/relayTransportFactory', () => ({
  createRelayTransport: () => mockTransport,
}));

vi.mock('../p2p/relayAuth', () => ({
  authorizeRelaySession: vi.fn(async () => ({ accessToken: 'relay-jwt' })),
  clearRelayAuthCache: vi.fn(),
}));

const AUTH: DiscordAuth = {
  userId: 'user-123',
  guildId: 'guild-1',
  channelId: 'channel-1',
  instanceId: 'instance-1',
  accessToken: 'test-access-token',
};

vi.mock('../discord/sdk', () => ({
  createDiscordSdk: vi.fn(() => ({
    clientId: 'test-client-id',
    init: vi.fn(async () => AUTH),
    getInstanceConnectedParticipants: vi.fn(async () => []),
    onParticipantsUpdate: vi.fn(() => () => {}),
  })),
}));

import App from '../App';

describe('App relay integration', () => {
  beforeEach(() => {
    handlers.clear();
    mockTransport.open = true;
    mockTransport.openTransport.mockClear();
    mockTransport.close.mockClear();
    mockTransport.sendPresence.mockClear();
    mockTransport.broadcast.mockClear();
    mockTransport.connectToPeer.mockClear();
    import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';
  });

  afterEach(() => {
    delete import.meta.env.VITE_DISCORD_CLIENT_ID;
  });

  it('renders the local board and sends presence on open', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(await screen.findByTestId('board-canvas')).toBeInTheDocument();
    expect(mockTransport.sendPresence).toHaveBeenCalled();
  });

  it('lets a spectator connect to a discovered peer and consume state', async () => {
    await act(async () => {
      render(<App />);
    });
    await screen.findByTestId('board-canvas');

    const metadata: PeerMetadata = {
      userId: 'remote-1',
      displayName: 'Alice',
      isPrivate: false,
    };
    act(() => mockTransport.emit('peerJoined', metadata));
    expect(await screen.findByText('Alice')).toBeInTheDocument();

    const spectateBtn = await screen.findByRole('button', { name: /^spectate$/i });
    await act(async () => {
      await userEvent.click(spectateBtn);
    });

    expect(screen.queryByTestId('board-canvas')).toBeNull();
    expect(screen.getByTestId('spectator-canvas')).toBeInTheDocument();
  });

  it('does not broadcast state while the transport is closed', async () => {
    await act(async () => {
      render(<App />);
    });
    await screen.findByTestId('board-canvas');

    await act(async () => {
      mockTransport.open = false;
      mockTransport.broadcast.mockClear();
      await new Promise((r) => setTimeout(r, 200));
    });

    expect(mockTransport.broadcast).not.toHaveBeenCalled();
  });

  it('broadcasts own state once connected to the relay', async () => {
    await act(async () => {
      render(<App />);
    });
    await screen.findByTestId('board-canvas');

    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    expect(mockTransport.broadcast).toHaveBeenCalled();
  });
});
