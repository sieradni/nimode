import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DataConnection, Peer } from 'peerjs';
import type { PeerMetadata } from '../types';
import type { SpectatorPayload } from '../../engine/types/instance';
import { PeerJSManager } from '../PeerJSManager';

type MockConn = DataConnection & {
  _emit: (event: string, ...args: unknown[]) => void;
};
type MockPeer = Peer & {
  _emit: (event: string, ...args: unknown[]) => void;
};

function createMockDataConnection(remotePeerId: string, metadata: unknown = {}): MockConn {
  const handlers: Record<string, Array<(...args: unknown[]) => void>> = {};
  const conn = {
    peer: remotePeerId,
    metadata,
    open: true,
    send: vi.fn(),
    close: vi.fn(),
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      (handlers[event] ??= []).push(cb);
    }),
    _emit: (event: string, ...args: unknown[]) => {
      handlers[event]?.forEach((cb) => cb(...args));
    },
  };
  return conn as unknown as MockConn;
}

function createMockPeer(id: string, dataConnection: MockConn): MockPeer {
  const handlers: Record<string, Array<(...args: unknown[]) => void>> = {};
  let assignedId = id;
  const peer = {
    get id() {
      return assignedId;
    },
    open: true,
    destroyed: false,
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      (handlers[event] ??= []).push(cb);
    }),
    connect: vi.fn(() => dataConnection),
    destroy: vi.fn(),
    _emit: (event: string, ...args: unknown[]) => {
      if (event === 'open' && typeof args[0] === 'string') {
        assignedId = args[0];
      }
      handlers[event]?.forEach((cb) => cb(...args));
    },
  };
  return peer as unknown as MockPeer;
}

function makePayload(overrides: Partial<SpectatorPayload> = {}): SpectatorPayload {
  return {
    userId: 'user-1',
    matrix: [],
    activePiece: null,
    queue: [],
    hold: null,
    annotations: [],
    stats: { pps: 0, apm: 0, kpp: 0, piecesPlaced: 0, linesCleared: 0 },
    ...overrides,
  };
}

describe('PeerJSManager', () => {
  let mockConn: MockConn;
  let mockPeer: MockPeer;

  beforeEach(() => {
    mockConn = createMockDataConnection('remote-spectator-1');
    mockPeer = createMockPeer('test-instance-id', mockConn);
  });

  describe('init', () => {
    it('creates a Peer with instanceId and stunServers via the factory', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'test-instance-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });

      await manager.init();

      expect(createPeer).toHaveBeenCalledWith('test-instance-id', ['stun:stun.l.google.com:19302']);
    });

    it('emits open with the assigned peer id when the Peer opens', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'test-instance-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const openHandler = vi.fn();
      manager.on('open', openHandler);

      await manager.init();
      mockPeer._emit('open', 'assigned-peer-id');

      expect(openHandler).toHaveBeenCalledWith('assigned-peer-id');
      expect(manager.open).toBe(true);
    });
  });

  describe('host mode', () => {
    it('emits peerJoined with default metadata when a spectator connects', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const joinedHandler = vi.fn();
      manager.on('peerJoined', joinedHandler);

      await manager.init();
      mockPeer._emit('connection', mockConn);

      expect(joinedHandler).toHaveBeenCalledTimes(1);
      const metadata: PeerMetadata = joinedHandler.mock.calls[0][0] as PeerMetadata;
      expect(metadata.userId).toBe('remote-spectator-1');
      expect(metadata.displayName).toBe('remote-spectator-1');
      expect(metadata.isPrivate).toBe(false);
    });

    it('uses metadata from the connection when present', async () => {
      const connWithMeta = createMockDataConnection('remote-2', {
        userId: 'discord-99',
        displayName: 'Alice',
      });
      const peer = createMockPeer('host-id', connWithMeta);
      const createPeer = vi.fn(() => peer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const joinedHandler = vi.fn();
      manager.on('peerJoined', joinedHandler);

      await manager.init();
      peer._emit('connection', connWithMeta);

      expect(joinedHandler).toHaveBeenCalledWith({ userId: 'discord-99', displayName: 'Alice', isPrivate: false });
    });

    it('reads isPrivate from connection metadata', async () => {
      const connWithMeta = createMockDataConnection('remote-2', {
        userId: 'discord-99',
        displayName: 'Alice',
        isPrivate: true,
      });
      const peer = createMockPeer('host-id', connWithMeta);
      const createPeer = vi.fn(() => peer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const joinedHandler = vi.fn();
      manager.on('peerJoined', joinedHandler);

      await manager.init();
      peer._emit('connection', connWithMeta);

      expect(joinedHandler).toHaveBeenCalledWith({
        userId: 'discord-99',
        displayName: 'Alice',
        isPrivate: true,
      });
    });

    it('broadcast sends payload to every connected spectator', async () => {
      const connA = createMockDataConnection('spectator-a');
      const connB = createMockDataConnection('spectator-b');
      const peer = createMockPeer('host-id', connA);
      peer.connect = vi.fn(() => connB);
      const createPeer = vi.fn(() => peer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });

      await manager.init();
      peer._emit('connection', connA);
      peer._emit('connection', connB);

      const payload = makePayload({ userId: 'host-id' });
      manager.broadcast(payload);

      expect(connA.send).toHaveBeenCalledWith(payload);
      expect(connB.send).toHaveBeenCalledWith(payload);
    });

    it('emits peerLeft and removes connection when a spectator disconnects', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const leftHandler = vi.fn();
      manager.on('peerLeft', leftHandler);

      await manager.init();
      mockPeer._emit('connection', mockConn);
      mockConn._emit('close');

      expect(leftHandler).toHaveBeenCalledWith('remote-spectator-1');
    });

    it('emits peerLeft with userId (not peerId) when metadata has custom userId', async () => {
      const connWithMeta = createMockDataConnection('remote-peer-id', {
        userId: 'custom-user-id',
        displayName: 'Bob',
      });
      const peer = createMockPeer('host-id', connWithMeta);
      const createPeer = vi.fn(() => peer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const leftHandler = vi.fn();
      manager.on('peerLeft', leftHandler);

      await manager.init();
      peer._emit('connection', connWithMeta);
      connWithMeta._emit('close');

      expect(leftHandler).toHaveBeenCalledWith('custom-user-id');
    });

    it('emits data when a spectator sends a payload to the host', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const dataHandler = vi.fn();
      manager.on('data', dataHandler);

      await manager.init();
      mockPeer._emit('connection', mockConn);
      const payload = makePayload();
      mockConn._emit('data', payload);

      expect(dataHandler).toHaveBeenCalledWith(payload);
    });
  });

  describe('outbound connections', () => {
    it('connects to a peer and emits data on received payloads', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'spectator-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const dataHandler = vi.fn();
      manager.on('data', dataHandler);

      await manager.init();
      manager.connectToPeer('host-id');

      expect(mockPeer.connect).toHaveBeenCalledWith(
        'host-id',
        expect.objectContaining({ serialization: 'json' })
      );
      const payload = makePayload({ userId: 'host-id' });
      mockConn._emit('data', payload);

      expect(dataHandler).toHaveBeenCalledWith(payload);
    });

    it('sends identity metadata on the outgoing connection', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'spectator-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });

      await manager.init();
      manager.connectToPeer('host-id', {
        userId: 'discord-1',
        displayName: 'Alice',
        isPrivate: false,
      });

      expect(mockPeer.connect).toHaveBeenCalledWith(
        'host-id',
        expect.objectContaining({
          metadata: { userId: 'discord-1', displayName: 'Alice', isPrivate: false },
        })
      );
    });

    it('emits peerJoined when the outgoing connection opens', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'spectator-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const joinedHandler = vi.fn();
      manager.on('peerJoined', joinedHandler);

      await manager.init();
      manager.connectToPeer('host-id', {
        userId: 'host-user',
        displayName: 'Host',
        isPrivate: false,
      });
      mockConn._emit('open');

      expect(joinedHandler).toHaveBeenCalledWith({
        userId: 'host-user',
        displayName: 'Host',
        isPrivate: false,
      });
    });

    it('emits peerLeft when the outgoing connection closes', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'spectator-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const leftHandler = vi.fn();
      manager.on('peerLeft', leftHandler);

      await manager.init();
      manager.connectToPeer('host-id', {
        userId: 'host-user',
        displayName: 'Host',
        isPrivate: false,
      });
      mockConn._emit('close');

      expect(leftHandler).toHaveBeenCalledWith('host-user');
    });
  });

  describe('error and close', () => {
    it('emits error when the Peer errors', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const errorHandler = vi.fn();
      manager.on('error', errorHandler);

      await manager.init();
      const err = new Error('network down');
      mockPeer._emit('error', err);

      expect(errorHandler).toHaveBeenCalledWith(err);
    });

    it('close destroys the Peer and closes all connections', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });

      await manager.init();
      mockPeer._emit('connection', mockConn);
      manager.close();

      expect(mockConn.close).toHaveBeenCalled();
      expect(mockPeer.destroy).toHaveBeenCalled();
      expect(manager.open).toBe(false);
    });

    it('emits closed when the Peer closes', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const closedHandler = vi.fn();
      manager.on('closed', closedHandler);

      await manager.init();
      mockPeer._emit('close');

      expect(closedHandler).toHaveBeenCalled();
      expect(manager.open).toBe(false);
    });
  });

  describe('presence', () => {
    it('auto-sends local presence when an incoming connection is already open', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
        metadata: { userId: 'me', displayName: 'Me', isPrivate: true },
      });

      await manager.init();
      mockPeer._emit('connection', mockConn);

      expect(mockConn.send).toHaveBeenCalledWith({
        kind: 'presence',
        metadata: { userId: 'me', displayName: 'Me', isPrivate: true },
      });
    });

    it('auto-sends presence once a pending connection opens', async () => {
      const pendingConn = createMockDataConnection('remote-1');
      (pendingConn as { open: boolean }).open = false;
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
        metadata: { userId: 'me', displayName: 'Me', isPrivate: false },
      });

      await manager.init();
      mockPeer._emit('connection', pendingConn);
      expect(pendingConn.send).not.toHaveBeenCalled();

      pendingConn._emit('open');

      expect(pendingConn.send).toHaveBeenCalledWith({
        kind: 'presence',
        metadata: { userId: 'me', displayName: 'Me', isPrivate: false },
      });
    });

    it('emits presence when a presence message is received', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const presenceHandler = vi.fn();
      manager.on('presence', presenceHandler);

      await manager.init();
      mockPeer._emit('connection', mockConn);
      mockConn._emit('data', {
        kind: 'presence',
        metadata: { userId: 'remote-1', displayName: 'Remote', isPrivate: true },
      });

      expect(presenceHandler).toHaveBeenCalledWith({
        userId: 'remote-1',
        displayName: 'Remote',
        isPrivate: true,
      });
    });

    it('does not emit presence for spectator payloads', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const presenceHandler = vi.fn();
      manager.on('presence', presenceHandler);

      await manager.init();
      mockPeer._emit('connection', mockConn);
      mockConn._emit('data', makePayload());

      expect(presenceHandler).not.toHaveBeenCalled();
    });

    it('sendPresence broadcasts to incoming and outgoing connections', async () => {
      const connB = createMockDataConnection('spectator-b');
      const peer = createMockPeer('host-id', connB);
      peer.connect = vi.fn(() => connB);
      const createPeer = vi.fn(() => peer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
        metadata: { userId: 'me', displayName: 'Me', isPrivate: false },
      });

      await manager.init();
      peer._emit('connection', mockConn);
      manager.connectToPeer('spectator-b');
      (mockConn.send as ReturnType<typeof vi.fn>).mockClear();
      (connB.send as ReturnType<typeof vi.fn>).mockClear();

      manager.sendPresence();

      expect(mockConn.send).toHaveBeenCalledWith({
        kind: 'presence',
        metadata: { userId: 'me', displayName: 'Me', isPrivate: false },
      });
      expect(connB.send).toHaveBeenCalledWith({
        kind: 'presence',
        metadata: { userId: 'me', displayName: 'Me', isPrivate: false },
      });
    });

    it('sendPresence updates the stored metadata', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
        metadata: { userId: 'me', displayName: 'Me', isPrivate: false },
      });

      await manager.init();
      mockPeer._emit('connection', mockConn);
      (mockConn.send as ReturnType<typeof vi.fn>).mockClear();

      manager.sendPresence({ userId: 'me', displayName: 'Me', isPrivate: true });

      expect(mockConn.send).toHaveBeenCalledWith({
        kind: 'presence',
        metadata: { userId: 'me', displayName: 'Me', isPrivate: true },
      });
    });
  });

  describe('helpers', () => {
    it('exposes id and role', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'my-instance',
        role: 'spectator',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });

      expect(manager.role).toBe('spectator');
      expect(manager.id).toBe('my-instance');

      await manager.init();
      mockPeer._emit('open', 'assigned-id');
      expect(manager.id).toBe('assigned-id');
    });

    it('off removes an event listener', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const handler = vi.fn();
      manager.on('peerJoined', handler);

      await manager.init();
      mockPeer._emit('connection', mockConn);
      expect(handler).toHaveBeenCalledTimes(1);

      manager.off('peerJoined', handler);
      mockPeer._emit('connection', mockConn);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('connectToPeer throws when peer is not initialized', () => {
      const manager = new PeerJSManager({
        instanceId: 'spectator-id',
        role: 'spectator',
        stunServers: ['stun:stun.l.google.com:19302'],
      });

      expect(() => manager.connectToPeer('host-id')).toThrow();
    });
  });

  describe('connection lifecycle', () => {
    it('does not open a duplicate outgoing connection to the same peer', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'spectator-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
        metadata: { userId: 'me', displayName: 'Me', isPrivate: false },
      });

      await manager.init();
      manager.connectToPeer('host-a');
      const callCount = vi.mocked(mockPeer.connect).mock.calls.length;

      // Connecting again to the same peer reuses the live connection.
      manager.connectToPeer('host-a');

      expect(vi.mocked(mockPeer.connect).mock.calls.length).toBe(callCount);
    });

    it('replaces a prior incoming connection from the same peer', async () => {
      const connA = createMockDataConnection('remote-1');
      const connB = createMockDataConnection('remote-1');
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });

      await manager.init();
      mockPeer._emit('connection', connA);
      mockPeer._emit('connection', connB);

      expect(connA.close).toHaveBeenCalled();
      // The newest connection is the one that receives subsequent state.
      const payload = makePayload();
      manager.broadcast(payload);
      expect(connB.send).toHaveBeenCalledWith(payload);
      // connA was replaced and is no longer in the active routing set
      // (it only received the initial presence handshake).
      expect(connA.send).toHaveBeenCalledTimes(1);
    });

    it('does not remove a live connection when a stale duplicate closes', async () => {
      const connA = createMockDataConnection('remote-1');
      const connB = createMockDataConnection('remote-1');
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });

      await manager.init();
      mockPeer._emit('connection', connA);
      mockPeer._emit('connection', connB);
      connA._emit('close');

      const payload = makePayload();
      manager.broadcast(payload);
      expect(connB.send).toHaveBeenCalledWith(payload);
    });
  });
});
