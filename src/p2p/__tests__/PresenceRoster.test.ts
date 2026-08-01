import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PeerJSManager } from '../PeerJSManager';
import type { PeerMetadata } from '../types';
import type { SpectatorPayload } from '../../engine/types/game';
import { PresenceRoster } from '../PresenceRoster';

function createMockPeerManager() {
  return {
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as PeerJSManager;
}

function getHandler(
  peerManager: PeerJSManager,
  event: string,
): (...args: unknown[]) => void {
  const on = peerManager.on as unknown as {
    mock: { calls: unknown[][] };
  };
  const call = on.mock.calls.find((c) => c[0] === event);
  if (!call) throw new Error(`Handler for "${event}" not found`);
  return call[1] as (...args: unknown[]) => void;
}

function makeMetadata(
  overrides: Partial<PeerMetadata> = {},
): PeerMetadata {
  return {
    userId: 'user-1',
    displayName: 'Alice',
    isPrivate: false,
    ...overrides,
  };
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

describe('PresenceRoster', () => {
  let mockPeerManager: ReturnType<typeof createMockPeerManager>;

  beforeEach(() => {
    mockPeerManager = createMockPeerManager();
  });

  it('getEntries() returns empty initially', () => {
    const roster = new PresenceRoster(mockPeerManager);
    expect(roster.getEntries()).toEqual([]);
  });

  it('start() subscribes to PeerJSManager events', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    expect(mockPeerManager.on).toHaveBeenCalledWith('peerJoined', expect.any(Function));
    expect(mockPeerManager.on).toHaveBeenCalledWith('peerLeft', expect.any(Function));
    expect(mockPeerManager.on).toHaveBeenCalledWith('data', expect.any(Function));
  });

  it('peerJoined adds entry with correct fields including isPrivate', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const handler = getHandler(mockPeerManager, 'peerJoined');
    handler(makeMetadata({ userId: 'user-1', displayName: 'Alice', isPrivate: false }));

    const entries = roster.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      userId: 'user-1',
      displayName: 'Alice',
      isPrivate: false,
      pps: 0,
      isConnected: true,
      isLocal: false,
    });
  });

  it('peerLeft removes entry by userId', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: 'user-1', displayName: 'Alice' }));
    expect(roster.getEntries()).toHaveLength(1);

    const left = getHandler(mockPeerManager, 'peerLeft');
    left('user-1');

    expect(roster.getEntries()).toEqual([]);
  });

  it('data event updates pps for matching userId', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: 'user-1', displayName: 'Alice' }));

    const data = getHandler(mockPeerManager, 'data');
    data(makePayload({ userId: 'user-1', stats: { pps: 2.5, apm: 0, kpp: 0, piecesPlaced: 0, linesCleared: 0 } }));

    const entries = roster.getEntries();
    expect(entries[0]!.pps).toBe(2.5);
  });

  it('onUpdate listener notified on changes', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const updateHandler = vi.fn();
    roster.onUpdate(updateHandler);

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: 'user-1', displayName: 'Alice' }));

    expect(updateHandler).toHaveBeenCalledTimes(1);
    expect(updateHandler).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ userId: 'user-1' })]),
    );
  });

  it('offUpdate stops notifications', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const updateHandler = vi.fn();
    roster.onUpdate(updateHandler);
    roster.offUpdate(updateHandler);

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: 'user-1', displayName: 'Alice' }));

    expect(updateHandler).not.toHaveBeenCalled();
  });

  it('canSpectate returns false for private, true for public', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: 'public-user', displayName: 'Alice', isPrivate: false }));
    joined(makeMetadata({ userId: 'private-user', displayName: 'Bob', isPrivate: true }));

    expect(roster.canSpectate('public-user')).toBe(true);
    expect(roster.canSpectate('private-user')).toBe(false);
  });

  it('seedEntry adds a discovered participant as not connected', () => {
    const roster = new PresenceRoster(mockPeerManager);

    roster.seedEntry(makeMetadata({ userId: 'discovered-1', displayName: 'Carol' }), false);

    const entries = roster.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      userId: 'discovered-1',
      displayName: 'Carol',
      isPrivate: false,
      pps: 0,
      isConnected: false,
      isLocal: false,
    });
    expect(roster.canSpectate('discovered-1')).toBe(true);
  });

  it('seedEntry does not downgrade an already connected entry', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: 'user-1', displayName: 'Alice' }));

    roster.seedEntry(makeMetadata({ userId: 'user-1', displayName: 'Alice' }), false);

    const entries = roster.getEntries();
    expect(entries[0]!.isConnected).toBe(true);
  });

  it('notifies listeners when seeding entries', () => {
    const roster = new PresenceRoster(mockPeerManager);
    const updateHandler = vi.fn();
    roster.onUpdate(updateHandler);

    roster.seedEntry(makeMetadata({ userId: 'discovered-1', displayName: 'Carol' }), false);

    expect(updateHandler).toHaveBeenCalledTimes(1);
    expect(updateHandler).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ userId: 'discovered-1' })]),
    );
  });

  it('stop() unsubscribes and clears entries', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: 'user-1', displayName: 'Alice' }));
    expect(roster.getEntries()).toHaveLength(1);

    roster.stop();

    expect(mockPeerManager.off).toHaveBeenCalledWith('peerJoined', expect.any(Function));
    expect(mockPeerManager.off).toHaveBeenCalledWith('peerLeft', expect.any(Function));
    expect(mockPeerManager.off).toHaveBeenCalledWith('data', expect.any(Function));
    expect(roster.getEntries()).toEqual([]);
  });

  it('getEntries() returns copies (mutating does not affect internal state)', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: 'user-1', displayName: 'Alice' }));

    const entries = roster.getEntries();
    entries[0]!.pps = 999;

    const fresh = roster.getEntries();
    expect(fresh[0]!.pps).toBe(0);
  });
});
