import { useEffect, useState } from 'react';
import { PresenceRoster as PresenceRosterManager } from '../p2p/PresenceRoster';
import type { PresenceEntry } from '../p2p/PresenceRoster';
import type { InstanceConfigStore } from '../p2p/InstanceConfigStore';

interface UsePresenceRosterOptions {
  roster: PresenceRosterManager | null;
  instanceConfigStore: InstanceConfigStore;
  localUserId: string;
  localDisplayName: string;
  localPps: number;
}

/**
 * Keeps a live list of every participant (local + remote) in sync with the
 * presence roster manager and the local instance's privacy config.
 */
export function usePresenceRoster({
  roster,
  instanceConfigStore,
  localUserId,
  localDisplayName,
  localPps,
}: UsePresenceRosterOptions): PresenceEntry[] {
  const [remoteEntries, setRemoteEntries] = useState<PresenceEntry[]>(() => roster?.getEntries() ?? []);
  const [isPrivate, setIsPrivate] = useState(() => instanceConfigStore.getConfig().isPrivate);

  useEffect(() => {
    if (!roster) return;
    const handleUpdate = (entries: PresenceEntry[]) => setRemoteEntries(entries);
    roster.onUpdate(handleUpdate);
    return () => {
      roster.offUpdate(handleUpdate);
    };
  }, [roster]);

  useEffect(() => {
    const handleChange = () => setIsPrivate(instanceConfigStore.getConfig().isPrivate);
    instanceConfigStore.subscribe(handleChange);
    return () => instanceConfigStore.unsubscribe(handleChange);
  }, [instanceConfigStore]);

  return [
    {
      userId: localUserId,
      displayName: localDisplayName,
      isPrivate,
      pps: localPps,
      isConnected: true,
      isLocal: true,
    },
    ...remoteEntries,
  ];
}
