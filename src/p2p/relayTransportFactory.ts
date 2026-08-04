import { SupabaseRelayTransport } from './SupabaseRelayTransport';
import { authorizeRelaySession } from './relayAuth';
import type { DiscordAuth } from '../discord/types';

export interface RelayTransportFactoryDeps {
  instanceId: string;
  userId: string;
  discordAccessToken: string;
  guildId?: string;
  channelId?: string;
}

export function createRelayTransport(deps: RelayTransportFactoryDeps): SupabaseRelayTransport {
  const { instanceId, userId, discordAccessToken, guildId = '', channelId = '' } = deps;

  const getJwt = async (): Promise<string | null> => {
    const auth: DiscordAuth = {
      userId,
      username: '',
      globalName: null,
      guildId,
      channelId,
      instanceId,
      accessToken: discordAccessToken,
    };
    const result = await authorizeRelaySession({ discordAuth: auth });
    return result?.accessToken ?? null;
  };

  return new SupabaseRelayTransport({ getJwt });
}