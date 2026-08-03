import type { PeerMetadata } from './types';
import type { SpectatorPayload } from '../engine/types/instance';

export type TransportEventMap = {
  open: () => void;
  error: (error: Error) => void;
  closed: () => void;
  peerJoined: (metadata: PeerMetadata) => void;
  peerLeft: (userId: string) => void;
  presence: (metadata: PeerMetadata) => void;
  data: (payload: SpectatorPayload) => void;
};

export interface PresenceTransportOptions {
  userId: string;
  displayName: string;
  instanceId: string;
  isPrivate: boolean;
}

export interface PresenceTransport {
  readonly open: boolean;
  on<K extends keyof TransportEventMap>(event: K, fn: TransportEventMap[K]): void;
  off<K extends keyof TransportEventMap>(event: K, fn: TransportEventMap[K]): void;
  openTransport(opts: PresenceTransportOptions): void | Promise<void>;
  close(): void;
  broadcast(payload: SpectatorPayload): void;
  sendPresence(metadata?: PeerMetadata): void;
  /**
   * Ask the transport to establish a connection to a remote peer that this
   * client wants to talk to directly (e.g. when spectating a remote host).
   * Relays may ignore this — broadcast already reaches every member.
   */
  connectToPeer?(userId: string, metadata?: PeerMetadata): void;
}
