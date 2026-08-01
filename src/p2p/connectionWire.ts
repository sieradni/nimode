import type { DataConnection } from 'peerjs';
import type { PeerMetadata, PresenceMessage } from './types';
import { isPresenceMessage } from './types';
import type { SpectatorPayload } from '../engine/types/game';

export interface WireConnectionHandlers {
  onPresence: (metadata: PeerMetadata) => void;
  onData: (payload: SpectatorPayload) => void;
  onError: (error: Error) => void;
  onClosed: () => void;
}

export function wireDataConnection(
  conn: DataConnection,
  metadata: PeerMetadata,
  handlers: WireConnectionHandlers,
): void {
  const sendPresence = (): void => {
    conn.send({ kind: 'presence', metadata } satisfies PresenceMessage);
  };
  if (conn.open) {
    sendPresence();
  } else {
    conn.on('open', sendPresence);
  }
  conn.on('data', (data: unknown) => {
    if (isPresenceMessage(data)) {
      handlers.onPresence(data.metadata);
    } else {
      handlers.onData(data as SpectatorPayload);
    }
  });
  conn.on('error', (err: Error) => {
    handlers.onError(err);
  });
  conn.on('close', handlers.onClosed);
}

export function sendPresenceToConnections(
  connections: DataConnection[],
  metadata: PeerMetadata,
): void {
  const message: PresenceMessage = { kind: 'presence', metadata };
  for (const conn of connections) {
    conn.send(message);
  }
}
