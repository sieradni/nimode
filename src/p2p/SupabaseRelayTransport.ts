import type { PeerMetadata } from './types';
import type { SpectatorPayload } from '../engine/types/instance';
import type { PresenceTransport, TransportEventMap, PresenceTransportOptions } from './transport';
import { getRelayFunctionUrl } from './supabaseEnv';
import { TypedEventEmitter } from './eventEmitter';

export interface RelayMemberState {
  userId: string;
  displayName: string;
  isPrivate: boolean;
  joinedAt: number;
}

export interface SupabaseRelayDeps {
  getJwt: () => Promise<string | null>;
}

export const STATE_EVENT = 'state';
export const PRESENCE_EVENT = 'presence';
const POLL_INTERVAL_MS = 500;
const BROADCAST_THROTTLE_MS = 50;
const PEER_TTL_MS = 10_000;

function toMetadata(s: RelayMemberState): PeerMetadata {
  return { userId: s.userId, displayName: s.displayName, isPrivate: s.isPrivate };
}

export class SupabaseRelayTransport
  extends TypedEventEmitter<TransportEventMap>
  implements PresenceTransport
{
  private readonly getJwt: () => Promise<string | null>;
  private current: PresenceTransportOptions | null = null;
  private myState: RelayMemberState | null = null;
  private openFlag = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private knownPeers = new Map<string, PeerMetadata>();
  private lastBroadcastAt = 0;
  private instanceId = '';
  private userId = '';

  get open(): boolean {
    return this.openFlag;
  }

  constructor(deps: SupabaseRelayDeps) {
    super();
    this.getJwt = deps.getJwt;
  }

  async openTransport(opts: PresenceTransportOptions): Promise<void> {
    if (this.openFlag) {
      this.emit('error', new Error('SupabaseRelayTransport already open'));
      return;
    }
    this.current = opts;
    this.instanceId = opts.instanceId;
    this.userId = opts.userId;
    this.myState = {
      userId: opts.userId,
      displayName: opts.displayName,
      isPrivate: opts.isPrivate,
      joinedAt: Date.now(),
    };

    const jwt = await this.getJwt();
    if (!jwt) {
      this.emit('error', new Error('Relay authorization failed: no access token'));
      this.tearDown();
      return;
    }

    this.openFlag = true;
    this.emit('open');
    this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }

  private async poll(): Promise<void> {
    if (!this.openFlag || !this.current) return;
    try {
      const url = `${getRelayFunctionUrl()}?instanceId=${encodeURIComponent(this.instanceId)}&userId=${encodeURIComponent(this.userId)}`;
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return;
       const data = (await res.json()) as {
          peers: Array<{ userId: string; displayName: string; isPrivate: boolean; payload: SpectatorPayload; timestamp: number }>;
        };
      const now = Date.now();
      const activePeers = new Set<string>();
      for (const peer of data.peers ?? []) {
        activePeers.add(peer.userId);
        const prev = this.knownPeers.get(peer.userId);
        const meta: PeerMetadata = {
          userId: peer.userId,
          displayName: peer.displayName,
          isPrivate: peer.isPrivate,
        };
        if (!prev || JSON.stringify(prev) !== JSON.stringify(meta)) {
          this.knownPeers.set(peer.userId, meta);
          this.emit('peerJoined', meta);
          this.emit('presence', meta);
        }
        if (peer.payload && now - peer.timestamp < PEER_TTL_MS) {
          this.emit('data', peer.payload);
        }
      }
      for (const [userId] of this.knownPeers) {
        if (!activePeers.has(userId) && userId !== this.userId) {
          this.knownPeers.delete(userId);
          this.emit('peerLeft', userId);
        }
      }
    } catch (e) {
      console.error('SupabaseRelayTransport poll error:', e);
    }
  }

  broadcast(payload: SpectatorPayload): void {
    if (!this.openFlag) return;
    const now = Date.now();
    if (now - this.lastBroadcastAt < BROADCAST_THROTTLE_MS) return;
    this.lastBroadcastAt = now;
    void this.sendRelay({ type: 'state', payload });
  }

  sendPresence(metadata?: PeerMetadata): void {
    if (!this.openFlag) return;
    this.sendRelay({ type: 'presence', metadata: metadata ?? toMetadata(this.myState!) });
  }

  connectToPeer(): void {
    // Relay fans out to all members; no pairwise connection needed.
  }

  close(): void {
    this.tearDown();
  }

  private async sendRelay(msg: { type: string; payload?: SpectatorPayload; metadata?: PeerMetadata }): Promise<void> {
    if (!this.openFlag) return;
    try {
      const jwt = await this.getJwt();
      if (!jwt) return;
      await fetch(getRelayFunctionUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          instanceId: this.instanceId,
          userId: this.userId,
          displayName: this.current?.displayName ?? this.userId,
          type: msg.type,
          payload: msg.payload,
          metadata: msg.metadata,
          timestamp: Date.now(),
        }),
      });
    } catch (e) {
      console.error('SupabaseRelayTransport sendRelay error:', e);
    }
  }

  private tearDown(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.openFlag = false;
    this.knownPeers.clear();
    this.myState = null;
    this.current = null;
  }
}