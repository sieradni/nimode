import { describe, it, expect, afterEach } from 'vitest';
import { getDiscordClientId } from '../config';

afterEach(() => {
  delete import.meta.env.VITE_DISCORD_CLIENT_ID;
});

describe('getDiscordClientId', () => {
  it('reads VITE_DISCORD_CLIENT_ID from the environment', () => {
    import.meta.env.VITE_DISCORD_CLIENT_ID = 'client-abc';
    expect(getDiscordClientId()).toBe('client-abc');
  });

  it('throws when VITE_DISCORD_CLIENT_ID is not set', () => {
    delete import.meta.env.VITE_DISCORD_CLIENT_ID;
    expect(() => getDiscordClientId()).toThrow('VITE_DISCORD_CLIENT_ID environment variable is required');
  });
});