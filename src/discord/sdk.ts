import { DiscordSDK } from '@discord/embedded-app-sdk';
import type { DiscordAuth, DiscordSdkWrapper } from './types';

export function createDiscordSdk(clientId: string): DiscordSdkWrapper {
  return {
    clientId,
    async init(): Promise<DiscordAuth> {
      const sdk = new DiscordSDK(clientId);
      await sdk.ready();
      const auth = await sdk.commands.authenticate({});
      return {
        userId: auth.user.id,
        guildId: sdk.guildId ?? '',
        channelId: sdk.channelId ?? '',
        instanceId: sdk.instanceId ?? '',
      };
    },
  };
}
