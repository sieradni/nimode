import { describe, it, expect, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useDiscordAuth } from '../useDiscordAuth';
import type { DiscordAuth, DiscordSdkWrapper } from '../types';

const AUTH: DiscordAuth = {
  userId: 'user-123',
  username: 'testuser',
  globalName: 'Test User',
  guildId: 'guild-1',
  channelId: 'channel-1',
  instanceId: 'instance-1',
  accessToken: 'test-access-token',
};

function createWrapper(init: DiscordSdkWrapper['init']): DiscordSdkWrapper {
  return {
    clientId: 'test-client-id',
    init,
    getInstanceConnectedParticipants: () => Promise.resolve([]),
    onParticipantsUpdate: () => () => {},
  };
}

describe('useDiscordAuth', () => {
  it('starts in connecting status', () => {
    const wrapper = createWrapper(() => new Promise<DiscordAuth>(() => {}));
    const { result } = renderHook(() => useDiscordAuth(wrapper));
    expect(result.current.status).toBe('connecting');
  });

  it('resolves to authenticated with the auth payload', async () => {
    const wrapper = createWrapper(async () => AUTH);
    const { result } = renderHook(() => useDiscordAuth(wrapper));
    expect(result.current.status).toBe('connecting');
    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    if (result.current.status === 'authenticated') {
      expect(result.current.auth).toEqual(AUTH);
    }
  });

  it('resolves to unavailable with an error string when init rejects', async () => {
    const wrapper = createWrapper(async () => {
      throw new Error('Not in Discord iframe');
    });
    const { result } = renderHook(() => useDiscordAuth(wrapper));
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
    if (result.current.status === 'unavailable') {
      expect(result.current.error).toBe('Not in Discord iframe');
    }
  });

  it.skip('resolves to unavailable when init times out', async () => {
    vi.useFakeTimers();
    try {
      const wrapper = createWrapper(() => new Promise<DiscordAuth>(() => {}));
      const { result } = renderHook(() => useDiscordAuth(wrapper));
      expect(result.current.status).toBe('connecting');
      
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });
      
      await waitFor(() => expect(result.current.status).toBe('unavailable'), { timeout: 1000 });
      if (result.current.status === 'unavailable') {
        expect(result.current.error).toContain('timed out');
      }
    } finally {
      vi.useRealTimers();
    }
  }, 15000);

  it('does not set state after unmount', async () => {
    let resolveInit!: (auth: DiscordAuth) => void;
    const deferred = new Promise<DiscordAuth>((resolve) => {
      resolveInit = resolve;
    });
    const init = vi.fn(() => deferred);
    const wrapper = createWrapper(init);

    const { result, unmount } = renderHook(() => useDiscordAuth(wrapper));
    unmount();
    await act(async () => {
      resolveInit(AUTH);
    });

    expect(init).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('connecting');
  });
});