import type { DataConnection, Peer } from 'peerjs';
import type {
  PeerConnectionEvents,
  PeerConnectionInfo,
  PeerJSManagerOptions,
  PeerMetadata,
  PeerFactory,
  PeerRole,
} from './types';
import { createPeerJSInstance } from './peerFactory';
import type { SpectatorPayload } from '../engine/types/game';

type ListenerOf<K extends keyof PeerConnectionEvents> = PeerConnectionEvents[K];

export class PeerJSManager {
  private peer: Peer | null = null;
  private readonly connections = new Map<string, PeerConnectionInfo>();
  private readonly listeners = new Map<
    keyof PeerConnectionEvents,
    Set<(...args: unknown[]) => void>
  >();
  private isOpen = false;

  readonly instanceId: string;
  readonly role: PeerRole;
  private readonly stunServers: string[];
  private readonly createPeer: PeerFactory;

  constructor(options: PeerJSManagerOptions) {
    this.instanceId = options.instanceId;
    this.role = options.role;
    this.stunServers = options.stunServers;
    this.createPeer = options.createPeer ?? createPeerJSInstance;
  }

  get id(): string {
    return this.peer?.id ?? this.instanceId;
  }

  get open(): boolean {
    return this.isOpen;
  }

  async init(): Promise<void> {
    this.peer = this.createPeer(this.instanceId, this.stunServers);
    this.setupPeerEvents();
  }

  private setupPeerEvents(): void {
    if (!this.peer) return;
    this.peer.on('open', (id: string) => {
      this.isOpen = true;
      this.emit('open', id);
    });
    this.peer.on('error', (err: Error) => {
      this.emit('error', err);
    });
    this.peer.on('close', () => {
      this.isOpen = false;
      this.emit('closed');
    });
    if (this.role === 'host') {
      this.peer.on('connection', (conn: DataConnection) => {
        this.handleIncomingConnection(conn);
      });
    }
  }

  private handleIncomingConnection(conn: DataConnection): void {
    const peerId = conn.peer;
    const raw = conn.metadata as Record<string, unknown> | undefined;
    const metadata: PeerMetadata = {
      userId: typeof raw?.userId === 'string' ? raw.userId : peerId,
      displayName: typeof raw?.displayName === 'string' ? raw.displayName : peerId,
      isPrivate: raw?.isPrivate === true,
    };
    this.connections.set(peerId, { peerId, metadata, connection: conn });
    this.emit('peerJoined', metadata);

    this.wireDataConnection(conn, () => {
      this.connections.delete(peerId);
      this.emit('peerLeft', metadata.userId);
    });
  }

  connectToHost(hostId: string): void {
    if (this.role !== 'spectator') {
      throw new Error('connectToHost is only available in spectator role');
    }
    if (!this.peer) {
      throw new Error('Peer not initialized; call init() first');
    }
    const conn = this.peer.connect(hostId, { serialization: 'json' });
    conn.on('open', () => {
      this.emit('open', this.peer!.id);
    });
    this.wireDataConnection(conn, () => {
      this.emit('closed');
    });
  }

  private wireDataConnection(conn: DataConnection, onClosed: () => void): void {
    conn.on('data', (data: unknown) => {
      this.emit('data', data as SpectatorPayload);
    });
    conn.on('error', (err: Error) => {
      this.emit('error', err);
    });
    conn.on('close', onClosed);
  }

  broadcast(payload: SpectatorPayload): void {
    for (const info of this.connections.values()) {
      info.connection.send(payload);
    }
  }

  on<K extends keyof PeerConnectionEvents>(event: K, fn: ListenerOf<K>): void {
    const set = this.listeners.get(event) ?? new Set<(...args: unknown[]) => void>();
    set.add(fn as (...args: unknown[]) => void);
    this.listeners.set(event, set);
  }

  off<K extends keyof PeerConnectionEvents>(event: K, fn: ListenerOf<K>): void {
    this.listeners.get(event)?.delete(fn as (...args: unknown[]) => void);
  }

  private emit<K extends keyof PeerConnectionEvents>(event: K, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((fn) => fn(...args));
  }

  close(): void {
    for (const info of this.connections.values()) {
      info.connection.close();
    }
    this.connections.clear();
    this.peer?.destroy();
    this.peer = null;
    this.isOpen = false;
  }
}
