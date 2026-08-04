export interface DiscordAuth {
  userId: string;
  username: string;
  globalName: string | null;
  guildId: string;
  channelId: string;
  instanceId: string;
  accessToken: string;
}

export interface ConnectedParticipant {
  id: string;
  username: string;
  displayName?: string;
}

export interface DiscordSdkWrapper {
  readonly clientId: string;
  init(): Promise<DiscordAuth>;
  getInstanceConnectedParticipants(): Promise<ConnectedParticipant[]>;
  onParticipantsUpdate(cb: (participants: ConnectedParticipant[]) => void): () => void;
}
