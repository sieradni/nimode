import { DiscordAuthStatus } from '../discord/useDiscordAuth';

interface AppHeaderProps {
  discordAuth: DiscordAuthStatus;
  onOpenAnnotationToolbar: () => void;
  onOpenSettings: () => void;
}

export function AppHeader({ discordAuth, onOpenAnnotationToolbar, onOpenSettings }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
      <h1 className="text-xl font-bold text-slate-200">nimode</h1>
      <div className="flex items-center gap-3">
        <div className="text-xs text-slate-400">Modern Tetris Engine Active</div>
        {discordAuth.status === 'connecting' && (
          <div className="text-xs text-slate-400">Connecting to Discord...</div>
        )}
        {discordAuth.status === 'authenticated' && (
          <div className="text-xs text-slate-300">Connected: {discordAuth.auth.userId}</div>
        )}
        {discordAuth.status === 'unavailable' && (
          <div className="text-xs text-slate-400">Standalone mode</div>
        )}
        <button
          onClick={onOpenAnnotationToolbar}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Annotation Toolbar"
        >
          ✏
        </button>
        <button
          onClick={onOpenSettings}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Settings"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
