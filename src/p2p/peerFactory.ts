import { Peer } from 'peerjs';

export function createPeerJSInstance(id: string, stunServers: string[]): Peer {
  return new Peer(id, {
    config: {
      iceServers: stunServers.map((url) => ({ urls: url })),
    },
  });
}
