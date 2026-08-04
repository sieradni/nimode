import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Eye, Users, ArrowLeft } from 'lucide-react';
import type { PresenceEntry } from '../p2p/PresenceRoster';

interface ParticipantsDropdownProps {
  entries: PresenceEntry[];
  targetId: string | null;
  localUserId: string;
  onSelectParticipant: (userId: string) => void;
  onReturnToLocal: () => void;
}

function participantLabel(entry: { userId: string; displayName: string }): string {
  if (entry.displayName && entry.displayName !== entry.userId) {
    return entry.displayName;
  }
  // The relay falls back to the raw userId (a Discord snowflake) when a
  // display_name is missing. Never render that bare number — show a neutral
  // placeholder instead.
  return `Player ${entry.userId.slice(-5)}`;
}

/**
 * Compact participants picker that floats at the top of the view, to the left
 * of the annotation/settings buttons. The trigger mirrors the current spectate
 * selection so it is always obvious who (if anyone) is being watched, and the
 * "You" row doubles as the way back to your own board.
 */
export function ParticipantsDropdown({
  entries,
  targetId,
  localUserId,
  onSelectParticipant,
  onReturnToLocal,
}: ParticipantsDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const spectating = targetId !== null;
  const activeTarget = spectating ? entries.find((entry) => entry.userId === targetId) ?? null : null;

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  const triggerLabel = spectating && activeTarget ? participantLabel(activeTarget) : 'Participants';
  const remoteCount = entries.filter((entry) => !entry.isLocal).length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={spectating ? `Spectating ${triggerLabel}` : 'Participants'}
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm shadow-sm transition-colors ${
          spectating
            ? 'border-slate-500 bg-slate-800 text-slate-200 hover:bg-slate-700'
            : 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
      >
        {spectating ? <Eye className="h-4 w-4" /> : <Users className="h-4 w-4" />}
        <span className="max-w-[10rem] truncate">{triggerLabel}</span>
        {!spectating && remoteCount > 0 && (
          <span className="rounded-full bg-slate-700 px-1.5 text-xs leading-4 text-slate-200">
            {remoteCount}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Participants"
          className="absolute right-0 top-full z-40 mt-2 w-72 max-h-[70vh] overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/95 p-2 shadow-xl backdrop-blur"
        >
          {entries.map((entry) => {
            const isLocal = entry.userId === localUserId;
            const isActiveTarget = entry.userId === targetId && spectating;

            if (isLocal) {
              if (spectating) {
                return (
                  <button
                    key={entry.userId}
                    type="button"
                    onClick={() => {
                      onReturnToLocal();
                      close();
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-md border border-slate-600 bg-slate-800/70 px-3 py-2 text-left text-sm text-slate-100 transition-colors hover:bg-slate-700"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>{participantLabel(entry)} (You)</span>
                    </span>
                    <span className="text-xs text-slate-300">Return to your board</span>
                  </button>
                );
              }
              return (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <span>{participantLabel(entry)}</span>
                    <span className="text-xs text-slate-400">(You)</span>
                    {entry.isPrivate && <span className="text-xs text-slate-400">Private</span>}
                  </span>
                  <span className="font-mono text-xs text-slate-300">{entry.pps.toFixed(2)}</span>
                </div>
              );
            }

            const spectatable = !entry.isPrivate && entry.isConnected;

            if (isActiveTarget) {
              return (
                <div
                  key={entry.userId}
                  role="option"
                  aria-selected
                  className="flex items-center justify-between gap-2 rounded bg-slate-800/80 px-3 py-2 text-sm text-slate-100 ring-1 ring-slate-500"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-slate-300" />
                    <span>{participantLabel(entry)}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-300">{entry.pps.toFixed(2)}</span>
                    <span className="text-[10px] uppercase tracking-wide text-slate-300">Watching</span>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={entry.userId}
                type="button"
                disabled={!spectatable}
                onClick={() => {
                  if (!spectatable) return;
                  onSelectParticipant(entry.userId);
                  close();
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  spectatable ? 'text-slate-200 hover:bg-slate-800' : 'cursor-default text-slate-500'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{participantLabel(entry)}</span>
                  {entry.isPrivate && <span className="text-xs text-slate-400">Private</span>}
                  {!entry.isConnected && <span className="text-xs text-slate-400">Connecting…</span>}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-300">{entry.pps.toFixed(2)}</span>
                  {spectatable && (
                    <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-white">Spectate</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}