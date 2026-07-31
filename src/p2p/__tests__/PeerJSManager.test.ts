import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DataConnection, Peer } from 'peerjs';
import type { PeerMetadata } from '../types';
import type { SpectatorPayload } from '../../engine/types/game';
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

  describe('spectator mode', () => {
    it('connects to a host and emits data on received payloads', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'spectator-id',
        role: 'spectator',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const dataHandler = vi.fn();
      manager.on('data', dataHandler);

      await manager.init();
      manager.connectToHost('host-id');

      expect(mockPeer.connect).toHaveBeenCalledWith('host-id', { serialization: 'json' });
      const payload = makePayload({ userId: 'host-id' });
      mockConn._emit('data', payload);

      expect(dataHandler).toHaveBeenCalledWith(payload);
    });

    it('emits open when the outgoing connection opens', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'spectator-id',
        role: 'spectator',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });
      const openHandler = vi.fn();
      manager.on('open', openHandler);

      await manager.init();
      manager.connectToHost('host-id');
      mockConn._emit('open');

      expect(openHandler).toHaveBeenCalled();
    });

    it('throws when connectToHost is called in host role', async () => {
      const createPeer = vi.fn(() => mockPeer);
      const manager = new PeerJSManager({
        instanceId: 'host-id',
        role: 'host',
        stunServers: ['stun:stun.l.google.com:19302'],
        createPeer,
      });

      await manager.init();
      expect(() => manager.connectToHost('other-id')).toThrow();
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

    it('connectToHost throws when peer is not initialized', () => {
      const manager = new PeerJSManager({
        instanceId: 'spectator-id',
        role: 'spectator',
        stunServers: ['stun:stun.l.google.com:19302'],
      });

      expect(() => manager.connectToHost('host-id')).toThrow();
    });
  });
});
