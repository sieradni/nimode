import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { DiscordAuth } from '../discord/types';

const { mockInit, mockCreatePeer } = vi.hoisted(() => ({
  mockInit: vi.fn(),
  mockCreatePeer: vi.fn(),
}));

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
  accessToken: 'test-access-token',
};

describe('App Discord integration', () => {
  beforeEach(() => {
    import.meta.env.VITE_DISCORD_CLIENT_ID = 'test-client-id';
    mockInit.mockReset();
    mockCreatePeer.mockReset();
    mockCreatePeer.mockReturnValue({ on: vi.fn(), connect: vi.fn(), destroy: vi.fn() });
  });

  afterEach(() => {
    delete import.meta.env.VITE_DISCORD_CLIENT_ID;
  });

  it('shows connecting status before authentication resolves', () => {
    mockInit.mockReturnValue(new Promise<DiscordAuth>(() => {}));
    render(<App />);
    expect(screen.getByText(/Connecting/i)).toBeInTheDocument();
  });

  it('shows the connected user when authentication succeeds', async () => {
    mockInit.mockResolvedValue(AUTH);
    render(<App />);
    // The user ID appears in the FloatingControls label (top-left)
    const label = await screen.findByText(/user-123/i, { selector: 'div[class*="pointer-events-none"]' });
    expect(label).toBeInTheDocument();
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
