import type {
  RealtimeChannel,
  RealtimeChannelOptions,
  RealtimePresenceJoinPayload,
  RealtimePresenceLeavePayload,
  SupabaseClient,
} from '@supabase/supabase-js';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import { TypedEventEmitter } from './eventEmitter';
import type { PresenceTransport, TransportEventMap, PresenceTransportOptions } from './transport';
import type { PeerMetadata } from './types';
import type { SpectatorPayload } from '../engine/types/instance';

export interface RelayMemberState {
  userId: string;
  displayName: string;
  isPrivate: boolean;
  joinedAt: number;
}

export type RelayBroadcastPayload =
  | { type: 'state'; payload: SpectatorPayload }
  | { type: 'presence'; metadata: PeerMetadata };

export interface SupabaseRelayDeps {
  /**
   * Builds an authenticated Supabase client given a member JWT returned by the
   * `authorize-activity` Edge Function. The JWT must encode the user + instance.
   */
  createClient: (jwt: string) => SupabaseClient;
  /** Resolves a member JWT, or null when the session is not authorized. */
  getJwt: () => Promise<string | null>;
}

export const STATE_EVENT = 'state';
export const PRESENCE_EVENT = 'presence';
const HEARTBEAT_MS = 1000;
const SYNC_WINDOW_MS = 200;

function toMetadata(s: RelayMemberState): PeerMetadata {
  return { userId: s.userId, displayName: s.displayName, isPrivate: s.isPrivate };
}

export class SupabaseRelayTransport
  extends TypedEventEmitter<TransportEventMap>
  implements PresenceTransport
{
  private readonly createClient: (jwt: string) => SupabaseClient;
  private readonly getJwt: () => Promise<string | null>;
  private client: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private current: PresenceTransportOptions | null = null;
  private myState: RelayMemberState | null = null;
  private readonly knownPeers = new Map<string, RelayMemberState>();
  private openFlag = false;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private syncing = false;

  constructor(deps: SupabaseRelayDeps) {
    super();
    this.createClient = deps.createClient;
    this.getJwt = deps.getJwt;
  }

  get open(): boolean {
    return this.openFlag;
  }

  async openTransport(opts: PresenceTransportOptions): Promise<void> {
    if (this.openFlag) {
      this.emit('error', new Error('SupabaseRelayTransport already open'));
      return;
    }
    this.current = opts;
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

    let client: SupabaseClient;
    try {
      client = this.createClient(jwt);
    } catch (err) {
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
      this.tearDown();
      return;
    }
    this.client = client;

    const channelConfig: RealtimeChannelOptions = {
      config: {
        presence: { key: opts.userId, enabled: true },
        broadcast: { self: false },
      },
    };

    const channel = client.channel(`room:${opts.instanceId}`, channelConfig);
    this.channel = channel;

    channel.on('presence', { event: 'sync' }, () => this.handlePresenceSync());
    channel.on<RelayMemberState>('presence', { event: 'join' }, (payload) => this.handlePresenceJoin(payload));
    channel.on<RelayMemberState>('presence', { event: 'leave' }, (payload) => this.handlePresenceLeave(payload));
    channel.on<RelayBroadcastPayload>('broadcast', { event: STATE_EVENT }, (payload) => {
      const msg = payload.payload;
      if (msg.type === 'state') {
        this.emit('data', msg.payload);
      } else {
        this.emit('presence', msg.metadata);
      }
    });
    channel.on<RelayBroadcastPayload>('broadcast', { event: PRESENCE_EVENT }, (payload) => {
      const msg = payload.payload;
      if (msg.type === 'presence') {
        this.broadcastPresenceToSelf(msg.metadata);
      }
    });

    channel.subscribe((status, err) => {
      if (status !== REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        this.emit('error', err ?? new Error(`Could not join relay room (status=${status})`));
        return;
      }
      void channel.track(this.trackedState());
      this.openFlag = true;
      this.emit('open');
    });

    this.heartbeat = setInterval(() => {
      if (this.channel && this.openFlag) {
        void this.channel.track(this.trackedState());
      }
    }, HEARTBEAT_MS);
  }

  private handlePresenceSync(): void {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => this.flushSync(), SYNC_WINDOW_MS);
  }

  private flushSync(): void {
    const channel = this.channel;
    if (!channel) return;
    this.syncing = true;
    const state = channel.presenceState<RelayMemberState>();
    const presentIds = new Set<string>();
    for (const [, presences] of Object.entries(state)) {
      for (const presence of presences) {
        const s = presence as unknown as RelayMemberState;
        presentIds.add(s.userId);
        const prev = this.knownPeers.get(s.userId);
        if (!prev || JSON.stringify(prev) !== JSON.stringify(s)) {
          this.knownPeers.set(s.userId, s);
          if (s.userId === this.current?.userId) {
            this.myState = s;
          } else {
            if (!prev) {
              this.emit('peerJoined', toMetadata(s));
            }
            this.emit('presence', toMetadata(s));
          }
        }
      }
    }
    const toRemove: string[] = [];
    this.knownPeers.forEach((_, userId) => {
      if (!presentIds.has(userId)) toRemove.push(userId);
    });
    for (const userId of toRemove) {
      this.knownPeers.delete(userId);
      if (userId !== this.current?.userId) this.emit('peerLeft', userId);
    }
    this.syncing = false;
  }

  private handlePresenceJoin(payload: RealtimePresenceJoinPayload<RelayMemberState>): void {
    if (this.syncing) {
      this.handlePresenceSync();
      return;
    }
    for (const presence of payload.newPresences) {
      const s = presence as unknown as RelayMemberState;
      const prev = this.knownPeers.get(s.userId);
      this.knownPeers.set(s.userId, s);
      if (s.userId === this.current?.userId) {
        this.myState = s;
      } else {
        if (!prev) this.emit('peerJoined', toMetadata(s));
        this.emit('presence', toMetadata(s));
      }
    }
  }

  private handlePresenceLeave(payload: RealtimePresenceLeavePayload<RelayMemberState>): void {
    if (this.syncing) {
      this.handlePresenceSync();
      return;
    }
    const prev = this.knownPeers.get(payload.key);
    if (prev && payload.currentPresences.length === 0) {
      this.knownPeers.delete(payload.key);
      if (payload.key !== this.current?.userId) this.emit('peerLeft', payload.key);
    }
  }

  private trackedState(): Record<string, unknown> {
    const s = this.myState;
    const c = this.current;
    if (!s || !c) return {};
    return {
      userId: s.userId,
      displayName: s.displayName,
      isPrivate: s.isPrivate,
      joinedAt: s.joinedAt,
    };
  }

  private broadcastPresenceToSelf(metadata: PeerMetadata): void {
    const cur = this.current;
    if (cur && metadata.userId === cur.userId) {
      this.emit('presence', metadata);
    }
  }

  private broadcastPresence(): void {
    const cur = this.current;
    if (!cur) return;
    const metadata: PeerMetadata = {
      userId: cur.userId,
      displayName: cur.displayName,
      isPrivate: cur.isPrivate,
    };
    void this.channel?.send({ type: 'broadcast', event: PRESENCE_EVENT, payload: { type: 'presence', metadata } });
  }

  broadcast(payload: SpectatorPayload): void {
    if (!this.channel || !this.openFlag) return;
    void this.channel.send({ type: 'broadcast', event: STATE_EVENT, payload: { type: 'state', payload } });
  }

  sendPresence(metadata?: PeerMetadata): void {
    this.broadcastPresence();
    if (metadata) {
      void this.channel?.send({ type: 'broadcast', event: PRESENCE_EVENT, payload: { type: 'presence', metadata } });
    }
  }

  connectToPeer(): void {
    // Relay already fans out to all members; no pairwise socket required.
  }

  close(): void {
    this.tearDown();
    this.emit('closed');
  }

  private tearDown(): void {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    const channel = this.channel;
    if (channel) {
      try {
        void channel.untrack();
      } catch {
        // best-effort teardown
      }
      try {
        this.client?.removeChannel(channel);
      } catch {
        // best-effort teardown
      }
    }
    this.channel = null;
    this.client = null;
    this.openFlag = false;
    this.knownPeers.clear();
    this.myState = null;
  }
}
