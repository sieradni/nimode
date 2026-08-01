import type { DataConnection, Peer } from 'peerjs';
import type { SpectatorPayload } from '../engine/types/game';

export type PeerRole = 'host' | 'spectator';

export interface PeerMetadata {
  userId: string;
  displayName: string;
  isPrivate: boolean;
}

export interface PeerConnectionEvents {
  open: (id: string) => void;
  data: (payload: SpectatorPayload) => void;
  peerJoined: (metadata: PeerMetadata) => void;
  peerLeft: (userId: string) => void;
  presence: (metadata: PeerMetadata) => void;
  error: (error: Error) => void;
  closed: () => void;
}

export type PeerFactory = (id: string, stunServers: string[]) => Peer;

export interface PeerJSManagerOptions {
  instanceId: string;
  role: PeerRole;
  stunServers: string[];
  createPeer?: PeerFactory;
  metadata?: PeerMetadata;
}

export interface PresenceMessage {
  kind: 'presence';
  metadata: PeerMetadata;
}

export function isPresenceMessage(value: unknown): value is PresenceMessage {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.kind === 'presence' &&
    typeof record.metadata === 'object' &&
    record.metadata !== null
  );
}

export interface PeerConnectionInfo {
  peerId: string;
  metadata: PeerMetadata;
  connection: DataConnection;
}
