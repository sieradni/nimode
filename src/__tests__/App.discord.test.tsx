import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { DiscordAuth } from '../discord/types';

const { mockInit } = vi.hoisted(() => ({
  mockInit: vi.fn(),
}));

vi.mock('../discord/sdk', () => ({
  createDiscordSdk: vi.fn(() => ({
    clientId: 'test-client-id',
    init: mockInit,
    getInstanceConnectedParticipants: vi.fn(async () => []),
    onParticipantsUpdate: vi.fn(() => () => {}),
  })),
}));

vi.mock('../p2p/relayTransportFactory', () => ({
  createRelayTransport: vi.fn(() => ({
    open: true,
    on: vi.fn(),
    off: vi.fn(),
    openTransport: vi.fn(async () => {}),
    close: vi.fn(),
    sendPresence: vi.fn(),
    broadcast: vi.fn(),
    connectToPeer: vi.fn(),
  })),
}));

vi.mock('../p2p/relayAuth', () => ({
  authorizeRelaySession: vi.fn(async () => ({ accessToken: 'relay-jwt' })),
  clearRelayAuthCache: vi.fn(),
}));

import App from '../App';

const AUTH: DiscordAuth = {
  userId: 'user-123',
  username: 'testuser',
  globalName: 'Test User',
  guildId: 'guild-1',
  channelId: 'channel-1',
  instanceId: 'instance-1',
  accessToken: 'test-access-token',
};

describe('App Discord integration', () => {
  beforeEach(() => {
    import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';
    mockInit.mockReset();
  });

  afterEach(() => {
    delete import.meta.env.VITE_DISCORD_CLIENT_ID;
  });

  it('shows connecting status before authentication resolves', () => {
    mockInit.mockReturnValue(new Promise<DiscordAuth>(() => {}));
    render(<App />);
    expect(screen.getByText(/Connecting/i)).toBeInTheDocument();
  });

  it('does not display the raw user id after authentication succeeds', async () => {
    mockInit.mockResolvedValue(AUTH);
    render(<App />);
    await screen.findByTestId('board-canvas');
    // The numeric Discord id must never appear as UI chrome (top-left label
    // was removed for a minimal interface).
    expect(screen.queryByText(/user-123/i)).not.toBeInTheDocument();
  });

  it('renders the board and no connection chrome when authentication fails', async () => {
    mockInit.mockRejectedValue(new Error('Not inside Discord iframe'));
    render(<App />);
    // Standalone mode is the minimal case: the board renders and the UI shows
    // no connection banner at all (US-6.1).
    expect(await screen.findByTestId('board-canvas')).toBeInTheDocument();
    expect(screen.queryByText(/Connecting/i)).not.toBeInTheDocument();
  });
});
