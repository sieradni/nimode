import { DiscordSDK } from '@discord/embedded-app-sdk';
import type { DiscordAuth, DiscordSdkWrapper, ConnectedParticipant } from './types';

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateInstanceId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function exchangeCodeForToken(
  clientId: string,
  code: string,
  codeVerifier: string
): Promise<string> {
  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${error.error_description ?? response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

function mapParticipant(p: {
  id: string;
  username: string;
  global_name?: string | null;
}): ConnectedParticipant {
  return { id: p.id, username: p.username, displayName: p.global_name ?? p.username };
}

export function createDiscordSdk(clientId: string): DiscordSdkWrapper {
  let sdk: DiscordSDK | null = null;

  return {
    clientId,
    async init(): Promise<DiscordAuth> {
      sdk = new DiscordSDK(clientId);
      await sdk.ready();

      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      const authResponse = await sdk.commands.authorize({
        client_id: clientId,
        response_type: 'code',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'none',
        scope: ['identify'],
      });

      if (!authResponse.code) {
        throw new Error('Authorization failed: no code returned');
      }

      const accessToken = await exchangeCodeForToken(clientId, authResponse.code, codeVerifier);

      const auth = await sdk.commands.authenticate({ access_token: accessToken });

      return {
        userId: auth.user.id,
        username: auth.user.username,
        globalName: auth.user.global_name ?? null,
        guildId: sdk.guildId ?? '',
        channelId: sdk.channelId ?? '',
        instanceId: sdk.instanceId ?? generateInstanceId(),
        accessToken,
      };
    },
    async getInstanceConnectedParticipants(): Promise<ConnectedParticipant[]> {
      if (!sdk) throw new Error('Discord SDK not initialized; call init() first');
      const { participants } = await sdk.commands.getInstanceConnectedParticipants();
      return participants.map(mapParticipant);
    },
    onParticipantsUpdate(cb: (participants: ConnectedParticipant[]) => void): () => void {
      if (!sdk) throw new Error('Discord SDK not initialized; call init() first');
      const listener = (data: { participants?: Array<{ id: string; username: string; global_name?: string | null }> }) => {
        if (Array.isArray(data.participants)) {
          cb(data.participants.map(mapParticipant));
        }
      };
      void sdk.subscribe('ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE', listener);
      return () => {
        void sdk?.unsubscribe('ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE', listener);
      };
    },
  };
}