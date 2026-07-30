import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuthenticate = vi.fn();
const mockReady = vi.fn();

vi.mock('@discord/embedded-app-sdk', () => ({
  DiscordSDK: vi.fn().mockImplementation(() => ({
    ready: mockReady,
    commands: { authenticate: mockAuthenticate },
    channelId: 'test-channel-id',
    instanceId: 'test-instance-id',
    guildId: 'test-guild-id',
  })),
}));

describe('DiscordSdkWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReady.mockResolvedValue(undefined);
    mockAuthenticate.mockResolvedValue({
      user: { id: 'user-123', username: 'testuser', discriminator: '0', public_flags: 0 },
      scopes: [],
      access_token: 'mock-token',
      expires: '2100-01-01T00:00:00.000Z',
      application: { id: 'app-1', description: '', name: 'test' },
    });
  });

  it('should initialize and return DiscordAuth on success', async () => {
    const { createDiscordSdk } = await import('../sdk');

    const wrapper = createDiscordSdk('test-client-id');
    const auth = await wrapper.init();

    expect(auth.userId).toBe('user-123');
    expect(auth.guildId).toBe('test-guild-id');
    expect(auth.channelId).toBe('test-channel-id');
    expect(auth.instanceId).toBe('test-instance-id');
    expect(wrapper.clientId).toBe('test-client-id');
  });

  it('should throw if SDK ready fails', async () => {
    mockReady.mockRejectedValue(new Error('SDK not ready'));

    const { createDiscordSdk } = await import('../sdk');
    const wrapper = createDiscordSdk('test-client-id');

    await expect(wrapper.init()).rejects.toThrow('SDK not ready');
  });

  it('should throw if authenticate fails', async () => {
    mockAuthenticate.mockRejectedValue(new Error('Auth denied'));

    const { createDiscordSdk } = await import('../sdk');
    const wrapper = createDiscordSdk('test-client-id');

    await expect(wrapper.init()).rejects.toThrow('Auth denied');
  });
});
