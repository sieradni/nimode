import type { PeerJSManager } from './PeerJSManager';
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
  private readonly peerManager: PeerJSManager;
  private readonly entries = new Map<string, PresenceEntry>();
  private readonly listeners = new Set<(entries: PresenceEntry[]) => void>();

  constructor(peerManager: PeerJSManager) {
    this.peerManager = peerManager;
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

  seedEntry(metadata: PeerMetadata, isConnected: boolean): void {
    const existing = this.entries.get(metadata.userId);
    if (existing?.isConnected) return;
    this.entries.set(metadata.userId, {
      userId: metadata.userId,
      displayName: metadata.displayName,
      isPrivate: metadata.isPrivate,
      pps: existing?.pps ?? 0,
      isConnected,
      isLocal: false,
    });
    this.notify();
  }

  private handlePeerJoined = (metadata: PeerMetadata): void => {
    this.entries.set(metadata.userId, {
      userId: metadata.userId,
      displayName: metadata.displayName,
      isPrivate: metadata.isPrivate,
      pps: 0,
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
      displayName: metadata.displayName,
      isPrivate: metadata.isPrivate,
      pps: existing?.pps ?? 0,
      isConnected: true,
      isLocal: false,
    });
    this.notify();
  };

  private notify(): void {
    const entries = this.getEntries();
    this.listeners.forEach((fn) => fn(entries));
  }
}
