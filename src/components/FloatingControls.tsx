import { DiscordAuthStatus } from '../discord/useDiscordAuth';

interface FloatingControlsProps {
  discordAuth: DiscordAuthStatus;
  onOpenAnnotationToolbar: () => void;
  onOpenSettings: () => void;
}

function connectionLabel(discordAuth: DiscordAuthStatus): string | null {
  if (discordAuth.status === 'connecting') return 'Connecting…';
  if (discordAuth.status === 'authenticated') return discordAuth.auth.userId;
  return null;
}

/**
 * Replaces the old header bar. Controls float over the corners of the view so
 * nothing competes with the board for vertical space (US-6.1).
 */
export function FloatingControls({
  discordAuth,
  onOpenAnnotationToolbar,
  onOpenSettings,
}: FloatingControlsProps) {
  const label = connectionLabel(discordAuth);

  return (
    <>
      {label && (
        <div className="pointer-events-none fixed left-4 top-4 z-30 text-[10px] uppercase tracking-wide text-slate-600">
          {label}
        </div>
      )}

      <div className="fixed right-4 top-4 z-30 flex items-center gap-1">
        <button
          onClick={onOpenAnnotationToolbar}
          aria-label="Annotation Toolbar"
          className="rounded-md bg-slate-900 p-2 text-slate-400 shadow-sm border border-slate-700 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          ✏
        </button>
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="rounded-md bg-slate-900 p-2 text-slate-400 shadow-sm border border-slate-700 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          ⚙
        </button>
      </div>
    </>
  );
}
