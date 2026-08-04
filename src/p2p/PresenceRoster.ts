import type { PresenceTransport } from './transport';
import type { PeerMetadata } from './types';
import type { SpectatorPayload } from '../engine/types/instance';

export interface PresenceEntry {
  userId: string;
  displayName: string;
  isPrivate: boolean;
  pps: number;
  isConnected: boolean;
  isLocal: boolean;
}

export class PresenceRoster {
  private readonly peerManager: PresenceTransport;
  private readonly entries = new Map<string, PresenceEntry>();
  private readonly listeners = new Set<(entries: PresenceEntry[]) => void>();

  constructor(peerManager: PresenceTransport) {
    this.peerManager = peerManager;
  }

  /**
   * A display name is "usable" when it is a real, human-readable name rather
   * than an artifact of a fallback. The relay occasionally emits the raw
   * `userId` (a Discord snowflake) as the display name when its stored
   * `display_name` is momentarily missing — that must never clobber a name
   * discovered through the Discord participant list.
   */
  private static isUsableName(name: string | undefined, userId: string): name is string {
    return name !== undefined && name !== '' && name !== userId;
  }

  private static pickDisplayName(
    current: string | undefined,
    incoming: string | undefined,
    userId: string,
  ): string {
    if (PresenceRoster.isUsableName(current, userId)) return current;
    if (PresenceRoster.isUsableName(incoming, userId)) return incoming;
    return incoming ?? current ?? '';
  }

  start(): void {
    this.peerManager.on('peerJoined', this.handlePeerJoined);
    this.peerManager.on('peerLeft', this.handlePeerLeft);
    this.peerManager.on('data', this.handleData);
    this.peerManager.on('presence', this.handlePresence);
  }

  stop(): void {
    this.peerManager.off('peerJoined', this.handlePeerJoined);
    this.peerManager.off('peerLeft', this.handlePeerLeft);
    this.peerManager.off('data', this.handleData);
    this.peerManager.off('presence', this.handlePresence);
    this.entries.clear();
    this.notify();
  }

  getEntries(): PresenceEntry[] {
    return Array.from(this.entries.values()).map((e) => ({ ...e }));
  }

  onUpdate(fn: (entries: PresenceEntry[]) => void): void {
    this.listeners.add(fn);
  }

  offUpdate(fn: (entries: PresenceEntry[]) => void): void {
    this.listeners.delete(fn);
  }

  canSpectate(userId: string): boolean {
    const entry = this.entries.get(userId);
    if (!entry) return false;
    return !entry.isPrivate;
  }

  removeEntry(userId: string): void {
    if (this.entries.delete(userId)) {
      this.notify();
    }
  }

  reconcile(participantIds: Iterable<string>): void {
    const present = new Set(participantIds);
    let changed = false;
    for (const [userId, entry] of this.entries) {
      if (!entry.isConnected && !present.has(userId)) {
        this.entries.delete(userId);
        changed = true;
      }
    }
    if (changed) {
      this.notify();
    }
  }

  seedEntry(metadata: PeerMetadata, isConnected: boolean): void {
    const existing = this.entries.get(metadata.userId);
    if (existing?.isConnected && !isConnected) {
      // Don't downgrade a known-connected peer to "connecting", but still
      // adopt a usable display name if the current value is a fallback id.
      const displayName = PresenceRoster.pickDisplayName(existing.displayName, metadata.displayName, metadata.userId);
      if (displayName !== existing.displayName) {
        this.entries.set(metadata.userId, { ...existing, displayName });
        this.notify();
      }
      return;
    }
    this.entries.set(metadata.userId, {
      userId: metadata.userId,
      displayName: PresenceRoster.pickDisplayName(existing?.displayName, metadata.displayName, metadata.userId),
      isPrivate: metadata.isPrivate,
      pps: existing?.pps ?? 0,
      isConnected,
      isLocal: false,
    });
    this.notify();
  }

  private handlePeerJoined = (metadata: PeerMetadata): void => {
    const existing = this.entries.get(metadata.userId);
    this.entries.set(metadata.userId, {
      userId: metadata.userId,
      displayName: PresenceRoster.pickDisplayName(existing?.displayName, metadata.displayName, metadata.userId),
      isPrivate: metadata.isPrivate,
      pps: existing?.pps ?? 0,
      isConnected: true,
      isLocal: false,
    });
    this.notify();
  };

  private handlePeerLeft = (userId: string): void => {
    this.entries.delete(userId);
    this.notify();
  };

  private handleData = (payload: SpectatorPayload): void => {
    const entry = this.entries.get(payload.userId);
    if (entry) {
      entry.pps = payload.stats.pps;
      this.notify();
    }
  };

  private handlePresence = (metadata: PeerMetadata): void => {
    const existing = this.entries.get(metadata.userId);
    this.entries.set(metadata.userId, {
      userId: metadata.userId,
      displayName: PresenceRoster.pickDisplayName(existing?.displayName, metadata.displayName, metadata.userId),
      isPrivate: metadata.isPrivate,
      pps: existing?.pps ?? 0,
      isConnected: true,
      isLocal: existing?.isLocal ?? false,
    });
    this.notify();
  };

  private notify(): void {
    const entries = this.getEntries();
    this.listeners.forEach((fn) => fn(entries));
  }
}
