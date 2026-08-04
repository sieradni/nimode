import { useState, useEffect } from 'react';
import { PresenceRoster as PresenceRosterManager } from '../p2p/PresenceRoster';
import type { PresenceEntry } from '../p2p/PresenceRoster';
import type { InstanceConfigStore } from '../p2p/InstanceConfigStore';

interface PresenceRosterProps {
  roster: PresenceRosterManager | null;
  instanceConfigStore: InstanceConfigStore;
  localUserId: string;
  localDisplayName: string;
  localPps: number;
  onSelectParticipant: (userId: string) => void;
}

function participantLabel(entry: PresenceEntry): string {
  if (entry.displayName && entry.displayName !== entry.userId) {
    return entry.displayName;
  }
  // The relay falls back to the raw userId (a Discord snowflake) when a
  // display_name is missing. Never render that bare number — show a neutral
  // placeholder instead.
  return `Player ${entry.userId.slice(-5)}`;
}

export function PresenceRoster({
  roster,
  instanceConfigStore,
  localUserId,
  localDisplayName,
  localPps,
  onSelectParticipant,
}: PresenceRosterProps) {
  const [remoteEntries, setRemoteEntries] = useState<PresenceEntry[]>(() => roster?.getEntries() ?? []);
  const [config, setConfig] = useState(() => instanceConfigStore.getConfig());

  useEffect(() => {
    if (!roster) return;

    const handleUpdate = (entries: PresenceEntry[]) => setRemoteEntries(entries);
    roster.onUpdate(handleUpdate);

    return () => {
      roster.offUpdate(handleUpdate);
    };
  }, [roster]);

  useEffect(() => {
    const handleChange = () => setConfig(instanceConfigStore.getConfig());
    instanceConfigStore.subscribe(handleChange);
    return () => instanceConfigStore.unsubscribe(handleChange);
  }, [instanceConfigStore]);

  const allEntries: PresenceEntry[] = [
    {
      userId: localUserId,
      displayName: localDisplayName,
      isPrivate: config.isPrivate,
      pps: localPps,
      isConnected: true,
      isLocal: true,
    },
    ...remoteEntries,
  ];

  return (
    <div className="bg-slate-900/85 border border-slate-700 rounded-lg p-4 w-64">
      <h3 className="text-sm font-bold text-slate-200 mb-3">Participants</h3>
      <div className="space-y-2">
        {allEntries.map((entry) => (
          <div
            key={entry.userId}
            className="flex items-center justify-between p-2 rounded bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-200">{participantLabel(entry)}</span>
              {entry.isLocal && (
                <span className="text-xs text-slate-400">(You)</span>
              )}
              {entry.isPrivate && (
                <span className="text-xs text-slate-400">Private</span>
              )}
              {!entry.isConnected && !entry.isLocal && (
                <span className="text-xs text-slate-400">Connecting…</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-mono">
                {entry.pps.toFixed(2)}
              </span>
              {!entry.isLocal && !entry.isPrivate && entry.isConnected && (
                <button
                  onClick={() => onSelectParticipant(entry.userId)}
                  className="px-2 py-0.5 text-xs rounded bg-slate-600 hover:bg-slate-500 text-white"
                >
                  Spectate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
