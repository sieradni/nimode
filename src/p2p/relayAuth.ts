import { getRelayFunctionUrl } from './supabaseEnv';
import type { DiscordAuth } from '../discord/types';

export interface RelayAuthResult {
  accessToken: string;
  displayName: string;
}

export interface RelayAuthDeps {
  discordAuth: DiscordAuth | null;
}

let cachedToken: { token: string; displayName: string; exp: number } | null = null;

export function clearRelayAuthCache(): void {
  cachedToken = null;
}

function cacheStillValid(exp: number): boolean {
  return Date.now() < exp;
}

export async function authorizeRelaySession(deps: RelayAuthDeps): Promise<RelayAuthResult | null> {
  const auth = deps.discordAuth;
  if (!auth) return null;

  if (cachedToken && cacheStillValid(cachedToken.exp)) {
    return { accessToken: cachedToken.token, displayName: cachedToken.displayName };
  }

  const funcUrl = getRelayFunctionUrl();
  const res = await fetch(funcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      discordAccessToken: auth.accessToken,
      instanceId: auth.instanceId,
      channelId: auth.channelId,
      guildId: auth.guildId,
      userId: auth.userId,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Relay authorization failed: ${res.status} ${res.statusText}${body ? ` ${body}` : ''}`);
  }

  const data = (await res.json()) as { accessToken: string; displayName: string; expiresAt: number };
  if (typeof data.accessToken !== 'string') {
    throw new Error('Relay authorization returned an invalid token');
  }
  const exp = Number.isFinite(data.expiresAt) ? data.expiresAt : Date.now() + 60 * 60 * 1000;
  cachedToken = { token: data.accessToken, displayName: data.displayName, exp };
  return { accessToken: data.accessToken, displayName: data.displayName };
}
