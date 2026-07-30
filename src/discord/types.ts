export interface DiscordAuth {
  userId: string;
  guildId: string;
  channelId: string;
  instanceId: string;
}

export interface DiscordSdkWrapper {
  readonly clientId: string;
  init(): Promise<DiscordAuth>;
}
