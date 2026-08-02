export function getDiscordClientId(): string {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  if (!clientId) {
    throw new Error('VITE_DISCORD_CLIENT_ID environment variable is required');
  }
  return clientId;
}
