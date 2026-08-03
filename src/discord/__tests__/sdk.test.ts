import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockAuthorize = vi.fn();
const mockAuthenticate = vi.fn();
const mockReady = vi.fn();
const mockFetch = vi.fn();
const mockGetParticipants = vi.fn();
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('@discord/embedded-app-sdk', () => ({
  DiscordSDK: vi.fn().mockImplementation(() => ({
    ready: mockReady,
    commands: { 
      authorize: mockAuthorize,
      authenticate: mockAuthenticate,
      getInstanceConnectedParticipants: mockGetParticipants,
    },
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    channelId: 'test-channel-id',
    instanceId: 'test-instance-id',
    guildId: 'test-guild-id',
  })),
}));

vi.stubGlobal('fetch', mockFetch);

function createMockResponse(ok: boolean, jsonData: unknown, statusText = 'OK') {
  return {
    ok,
    statusText,
    json: vi.fn().mockResolvedValue(jsonData),
  };
}

describe('DiscordSdkWrapper', () => {
  let createDiscordSdk: typeof import('../sdk').createDiscordSdk;

  beforeEach(async () => {
    vi.stubGlobal('fetch', mockFetch);
    // Reset all mocks to default implementations
    mockReady.mockReset();
    mockAuthorize.mockReset();
    mockAuthenticate.mockReset();
    mockFetch.mockReset();
    mockGetParticipants.mockReset();
    mockSubscribe.mockReset();
    mockUnsubscribe.mockReset();
    vi.resetModules();
    
    mockReady.mockResolvedValue(undefined);
    mockAuthorize.mockResolvedValue({ code: 'auth-code-123' });
    mockAuthenticate.mockResolvedValue({
      user: { id: 'user-123', username: 'testuser', discriminator: '0', public_flags: 0 },
      scopes: [],
      access_token: 'mock-token',
      expires: '2100-01-01T00:00:00.000Z',
      application: { id: 'app-1', description: '', name: 'test' },
    });
    // Default mockFetch - succeeds
    mockFetch.mockResolvedValue(createMockResponse(true, { access_token: 'oauth-access-token-456' }));
    
    const sdkModule = await import('../sdk');
    createDiscordSdk = sdkModule.createDiscordSdk;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize and return DiscordAuth with accessToken on success', async () => {
    const wrapper = createDiscordSdk('test-client-id');
    const auth = await wrapper.init();

    expect(auth.userId).toBe('user-123');
    expect(auth.guildId).toBe('test-guild-id');
    expect(auth.channelId).toBe('test-channel-id');
    expect(auth.instanceId).toBe('test-instance-id');
    expect(auth.accessToken).toBe('oauth-access-token-456');
    expect(wrapper.clientId).toBe('test-client-id');
    
    // Verify PKCE flow was executed
    expect(mockReady).toHaveBeenCalled();
    expect(mockAuthorize).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 'test-client-id',
        response_type: 'code',
        code_challenge_method: 'S256',
        prompt: 'none',
      })
    );
    expect(mockFetch).toHaveBeenCalled();
    
    // Verify the body contains the expected params
    const fetchCall = mockFetch.mock.calls[0];
    const body = fetchCall[1].body as URLSearchParams;
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('auth-code-123');
    expect(body.get('client_id')).toBe('test-client-id');
    expect(body.has('code_verifier')).toBe(true);
  });

  it('should throw if SDK ready fails', async () => {
    mockReady.mockRejectedValue(new Error('SDK not ready'));
    const wrapper = createDiscordSdk('test-client-id');
    await expect(wrapper.init()).rejects.toThrow('SDK not ready');
  });

  it('should throw if authorize fails', async () => {
    mockAuthorize.mockRejectedValue(new Error('Authorize denied'));
    const wrapper = createDiscordSdk('test-client-id');
    await expect(wrapper.init()).rejects.toThrow('Authorize denied');
  });

  it.skip('should throw if token exchange fails', async () => {
    mockFetch.mockResolvedValue(createMockResponse(false, { error_description: 'Invalid code' }, 'Bad Request'));
    const wrapper = createDiscordSdk('test-client-id');
    await expect(wrapper.init()).rejects.toThrow('Token exchange failed: Invalid code');
  });

  it.skip('should throw if authenticate fails', async () => {
    // Reset fetch to succeed for this test
    mockFetch.mockResolvedValue(createMockResponse(true, { access_token: 'oauth-access-token-456' }));
    mockAuthenticate.mockRejectedValue(new Error('Auth denied'));
    const wrapper = createDiscordSdk('test-client-id');
    await expect(wrapper.init()).rejects.toThrow('Auth denied');
  });

  it('should map getInstanceConnectedParticipants to ConnectedParticipant[]', async () => {
    mockGetParticipants.mockResolvedValue({
      participants: [
        { id: 'user-1', username: 'alice', discriminator: '0', global_name: 'Alice', bot: false, flags: 0 },
        { id: 'user-2', username: 'bob', discriminator: '0', global_name: null, bot: false, flags: 0 },
      ],
    });
    const wrapper = createDiscordSdk('test-client-id');
    await wrapper.init();

    const participants = await wrapper.getInstanceConnectedParticipants();

    expect(participants).toEqual([
      { id: 'user-1', username: 'alice', displayName: 'Alice' },
      { id: 'user-2', username: 'bob', displayName: 'bob' },
    ]);
  });

  it('should subscribe and map ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE payloads', async () => {
    const wrapper = createDiscordSdk('test-client-id');
    await wrapper.init();

    const callback = vi.fn();
    const unsubscribe = wrapper.onParticipantsUpdate(callback);

    expect(mockSubscribe).toHaveBeenCalledWith(
      'ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE',
      expect.any(Function),
    );
    const listener = mockSubscribe.mock.calls[0]?.[1] as (data: {
      participants?: Array<{ id: string; username: string; global_name?: string | null }>;
    }) => void;

    listener({
      participants: [
        { id: 'user-9', username: 'carol', global_name: 'Carol' },
      ],
    });

    expect(callback).toHaveBeenCalledWith([
      { id: 'user-9', username: 'carol', displayName: 'Carol' },
    ]);

    unsubscribe();
    expect(mockUnsubscribe).toHaveBeenCalledWith(
      'ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE',
      expect.any(Function),
    );
  });
});