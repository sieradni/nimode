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
import { wireDataConnection, sendPresenceToConnections } from './connectionWire';
import { TypedEventEmitter } from './eventEmitter';
import type { SpectatorPayload } from '../engine/types/game';

export class PeerJSManager extends TypedEventEmitter<PeerConnectionEvents> {
  private peer: Peer | null = null;
  private readonly connections = new Map<string, PeerConnectionInfo>();
  private readonly outgoingConnections = new Set<DataConnection>();
  private isOpen = false;
  private metadata: PeerMetadata;

  readonly instanceId: string;
  readonly role: PeerRole;
  private readonly stunServers: string[];
  private readonly createPeer: PeerFactory;

  constructor(options: PeerJSManagerOptions) {
    super();
    this.instanceId = options.instanceId;
    this.role = options.role;
    this.stunServers = options.stunServers;
    this.createPeer = options.createPeer ?? createPeerJSInstance;
    this.metadata = options.metadata ?? {
      userId: options.instanceId,
      displayName: options.instanceId,
      isPrivate: false,
    };
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

  connectToPeer(peerId: string, metadata?: PeerMetadata): void {
    if (!this.peer) {
      throw new Error('Peer not initialized; call init() first');
    }
    const meta: PeerMetadata = metadata ?? {
      userId: peerId,
      displayName: peerId,
      isPrivate: false,
    };
    const conn = this.peer.connect(peerId, { serialization: 'json', metadata: meta });
    if (!conn) return;
    this.outgoingConnections.add(conn);
    conn.on('open', () => {
      this.emit('peerJoined', meta);
    });
    this.wireDataConnection(conn, () => {
      this.outgoingConnections.delete(conn);
      this.emit('peerLeft', meta.userId);
    });
  }

  private wireDataConnection(conn: DataConnection, onClosed: () => void): void {
    wireDataConnection(conn, this.metadata, {
      onPresence: (metadata) => this.emit('presence', metadata),
      onData: (payload) => this.emit('data', payload),
      onError: (error) => this.emit('error', error),
      onClosed,
    });
  }

  broadcast(payload: SpectatorPayload): void {
    for (const info of this.connections.values()) {
      info.connection.send(payload);
    }
  }

  sendPresence(metadata?: PeerMetadata): void {
    if (metadata) this.metadata = metadata;
    const connections: DataConnection[] = [
      ...[...this.connections.values()].map((info) => info.connection),
      ...this.outgoingConnections,
    ];
    sendPresenceToConnections(connections, this.metadata);
  }

  close(): void {
    for (const info of this.connections.values()) info.connection.close();
    this.connections.clear();
    for (const conn of this.outgoingConnections) conn.close();
    this.outgoingConnections.clear();
    this.peer?.destroy();
    this.peer = null;
    this.isOpen = false;
  }
}
