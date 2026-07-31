import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { DiscordAuth } from '../discord/types';

const { mockInit } = vi.hoisted(() => ({ mockInit: vi.fn() }));

vi.mock('../discord/sdk', () => ({
  createDiscordSdk: vi.fn(() => ({
    clientId: 'test-client-id',
    init: mockInit,
  })),
}));

import App from '../App';

const AUTH: DiscordAuth = {
  userId: 'user-123',
  guildId: 'guild-1',
  channelId: 'channel-1',
  instanceId: 'instance-1',
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
    expect(screen.getByText(/Connecting to Discord/i)).toBeInTheDocument();
  });

  it('shows the connected user when authentication succeeds', async () => {
    mockInit.mockResolvedValue(AUTH);
    render(<App />);
    expect(await screen.findByText(/Connected: user-123/i)).toBeInTheDocument();
  });

  it('shows standalone mode and does not crash when authentication fails', async () => {
    mockInit.mockRejectedValue(new Error('Not inside Discord iframe'));
    render(<App />);
    expect(await screen.findByText(/Standalone mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Modern Tetris Engine Active/i)).toBeInTheDocument();
  });
});
