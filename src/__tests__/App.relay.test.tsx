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
  username: 'testuser',
  globalName: 'Test User',
  guildId: 'guild-1',
  channelId: 'channel-1',
  instanceId: 'instance-1',
  accessToken: 'test-access-token',
};

import type { ConnectedParticipant } from '../discord/types';

const mockGetInstanceConnectedParticipants = vi.fn(async (): Promise<ConnectedParticipant[]> => []);
const mockOnParticipantsUpdate = vi.fn(() => () => {});

vi.mock('../discord/sdk', () => ({
  createDiscordSdk: vi.fn(() => ({
    clientId: 'test-client-id',
    init: vi.fn(async () => AUTH),
    getInstanceConnectedParticipants: mockGetInstanceConnectedParticipants,
    onParticipantsUpdate: mockOnParticipantsUpdate,
  })),
}));

import App from '../App';

async function openParticipantsDropdown(): Promise<void> {
  const trigger = await screen.findByRole('button', { name: /(participants|spectating)/i });
  await userEvent.click(trigger);
}

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
    await openParticipantsDropdown();
    expect(await screen.findByText('Alice')).toBeInTheDocument();

    const spectateBtn = await screen.findByRole('button', { name: /spectate/i });
    await act(async () => {
      await userEvent.click(spectateBtn);
    });

    // Emit spectator state data to simulate the remote peer's state arriving
    const spectatorPayload = {
      userId: 'remote-1',
      matrix: Array.from({ length: 40 }, () => Array(10).fill(0)),
      activePiece: null,
      queue: [],
      hold: null,
      annotations: Array.from({ length: 40 }, () => Array(10).fill(0)),
      userPalette: ['#ffffff'],
      stats: { ...DEFAULT_GAME_STATS, pps: 0, apm: 0, kpp: 0, piecesPlaced: 0, linesCleared: 0 },
    };
    act(() => mockTransport.emit('data', spectatorPayload));

    // Wait for the spectator board canvas to appear (now uses same board-canvas testid)
    await screen.findByTestId('board-canvas');
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

  it('shows Discord activity participants as connecting in the roster', async () => {
    mockGetInstanceConnectedParticipants.mockResolvedValue([
      { id: 'discord-user-2', username: 'alice', displayName: 'Alice' },
    ]);

    await act(async () => {
      render(<App />);
    });
    await screen.findByTestId('board-canvas');
    await openParticipantsDropdown();

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Connecting…')).toBeInTheDocument();
    expect(screen.queryByText(/Spectate/i)).not.toBeInTheDocument();
  });

  it('shows spectate button when a connecting participant joins the relay', async () => {
    mockGetInstanceConnectedParticipants.mockResolvedValue([
      { id: 'discord-user-2', username: 'alice', displayName: 'Alice' },
    ]);

    await act(async () => {
      render(<App />);
    });
    await screen.findByTestId('board-canvas');
    await openParticipantsDropdown();

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Connecting…')).toBeInTheDocument();

    act(() => {
      mockTransport.emit('peerJoined', { userId: 'discord-user-2', displayName: 'Alice', isPrivate: false });
    });

    expect(screen.queryByText('Connecting…')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /spectate/i })).toBeInTheDocument();
  });

  it('returns to the local board from spectating via the participants dropdown', async () => {
    await act(async () => {
      render(<App />);
    });
    await screen.findByTestId('board-canvas');

    act(() =>
      mockTransport.emit('peerJoined', { userId: 'remote-1', displayName: 'Alice', isPrivate: false }),
    );
    await openParticipantsDropdown();
    await act(async () => {
      await userEvent.click(await screen.findByRole('button', { name: /spectate/i }));
    });

    expect(await screen.findByRole('button', { name: /spectating alice/i })).toBeInTheDocument();

    await openParticipantsDropdown();
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /return to your board/i }));
    });

    expect(await screen.findByRole('button', { name: /^participants$/i })).toBeInTheDocument();
  });
});
