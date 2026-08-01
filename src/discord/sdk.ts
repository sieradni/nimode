import { DiscordSDK } from '@discord/embedded-app-sdk';
import type { DiscordAuth, DiscordSdkWrapper, ConnectedParticipant } from './types';

export function createDiscordSdk(clientId: string): DiscordSdkWrapper {
  let sdk: DiscordSDK | null = null;

  return {
    clientId,
    async init(): Promise<DiscordAuth> {
      sdk = new DiscordSDK(clientId);
      await sdk.ready();
      const auth = await sdk.commands.authenticate({});
      return {
        userId: auth.user.id,
        guildId: sdk.guildId ?? '',
        channelId: sdk.channelId ?? '',
        instanceId: sdk.instanceId ?? '',
      };
    },
    async getInstanceConnectedParticipants(): Promise<ConnectedParticipant[]> {
      if (!sdk) throw new Error('Discord SDK not initialized; call init() first');
      const { participants } = await sdk.commands.getInstanceConnectedParticipants();
      return participants.map((p) => ({
        id: p.id,
        username: p.username,
        displayName: p.global_name ?? p.username,
      }));
    },
  };
}
