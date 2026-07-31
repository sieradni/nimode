export function getDiscordClientId(): string {
  return import.meta.env.VITE_DISCORD_CLIENT_ID ?? '';
}
