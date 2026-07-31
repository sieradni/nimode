import { useState, useEffect } from 'react';
import { PresenceRoster as PresenceRosterManager } from '../p2p/PresenceRoster';
import type { PresenceEntry } from '../p2p/PresenceRoster';
import type { PeerJSManager } from '../p2p/PeerJSManager';
import type { InstanceConfigStore } from '../p2p/InstanceConfigStore';

interface PresenceRosterProps {
  peerManager: PeerJSManager;
  instanceConfigStore: InstanceConfigStore;
  localUserId: string;
  localDisplayName: string;
  localPps: number;
  onSelectParticipant: (userId: string) => void;
}

export function PresenceRoster({
  peerManager,
  instanceConfigStore,
  localUserId,
  localDisplayName,
  localPps,
  onSelectParticipant,
}: PresenceRosterProps) {
  const [remoteEntries, setRemoteEntries] = useState<PresenceEntry[]>([]);
  const [config, setConfig] = useState(() => instanceConfigStore.getConfig());

  useEffect(() => {
    const roster = new PresenceRosterManager(peerManager);
    roster.start();

    const handleUpdate = (entries: PresenceEntry[]) => setRemoteEntries(entries);
    roster.onUpdate(handleUpdate);

    return () => {
      roster.offUpdate(handleUpdate);
      roster.stop();
    };
  }, [peerManager]);

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
      <h3 className="text-sm font-bold text-sky-400 mb-3">Participants</h3>
      <div className="space-y-2">
        {allEntries.map((entry) => (
          <div
            key={entry.userId}
            className="flex items-center justify-between p-2 rounded bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-200">{entry.displayName}</span>
              {entry.isLocal && (
                <span className="text-xs text-slate-400">(You)</span>
              )}
              {entry.isPrivate && (
                <span className="text-xs text-red-400">Private</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyan-400 font-mono">
                {entry.pps.toFixed(2)}
              </span>
              {!entry.isLocal && !entry.isPrivate && (
                <button
                  onClick={() => onSelectParticipant(entry.userId)}
                  className="px-2 py-0.5 text-xs rounded bg-sky-600 hover:bg-sky-500 text-white"
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
