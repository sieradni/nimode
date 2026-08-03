import { SupabaseRelayTransport } from './SupabaseRelayTransport';
import { authorizeRelaySession } from './relayAuth';
import type { DiscordAuth } from '../discord/types';

export interface RelayTransportFactoryDeps {
  instanceId: string;
  userId: string;
  discordAccessToken: string;
}

export function createRelayTransport(deps: RelayTransportFactoryDeps): SupabaseRelayTransport {
  const { instanceId, userId, discordAccessToken } = deps;

  const getJwt = async (): Promise<string | null> => {
    const auth: DiscordAuth = {
      userId,
      guildId: '',
      channelId: '',
      instanceId,
      accessToken: discordAccessToken,
    };
    const result = await authorizeRelaySession({ discordAuth: auth });
    return result?.accessToken ?? null;
  };

  return new SupabaseRelayTransport({ getJwt });
}