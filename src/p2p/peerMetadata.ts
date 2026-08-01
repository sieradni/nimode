import type { DataConnection } from 'peerjs';
import type { PeerMetadata } from './types';

export function parsePeerMetadata(conn: DataConnection): PeerMetadata {
  const raw = conn.metadata as Record<string, unknown> | undefined;
  return {
    userId: typeof raw?.userId === 'string' ? raw.userId : conn.peer,
    displayName: typeof raw?.displayName === 'string' ? raw.displayName : conn.peer,
    isPrivate: raw?.isPrivate === true,
  };
}
