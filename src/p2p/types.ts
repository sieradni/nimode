import type { DataConnection, Peer } from 'peerjs';
import type { SpectatorPayload } from '../engine/types/game';

export type PeerRole = 'host' | 'spectator';

export interface PeerMetadata {
  userId: string;
  displayName: string;
}

export interface PeerConnectionEvents {
  open: (id: string) => void;
  data: (payload: SpectatorPayload) => void;
  peerJoined: (metadata: PeerMetadata) => void;
  peerLeft: (peerId: string) => void;
  error: (error: Error) => void;
  closed: () => void;
}

export type PeerFactory = (id: string, stunServers: string[]) => Peer;

export interface PeerJSManagerOptions {
  instanceId: string;
  role: PeerRole;
  stunServers: string[];
  createPeer?: PeerFactory;
}

export interface PeerConnectionInfo {
  peerId: string;
  metadata: PeerMetadata;
  connection: DataConnection;
}
