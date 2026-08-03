import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRelayTransport } from './SupabaseRelayTransport';
import type { SupabaseRelayDeps } from './SupabaseRelayTransport';
import { authorizeRelaySession } from './relayAuth';
import { getSupabaseUrl, getSupabaseAnonKey } from './supabaseEnv';
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

  const supabaseDeps: SupabaseRelayDeps = {
    createClient: (jwt: string): SupabaseClient =>
      createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
        accessToken: async () => jwt,
        realtime: {
          params: {
            apikey: getSupabaseAnonKey(),
            instance_id: instanceId,
          },
        },
      }),
    getJwt,
  };

  return new SupabaseRelayTransport(supabaseDeps);
}
