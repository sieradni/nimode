import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PresenceTransport } from '../transport';
import type { PeerMetadata } from '../types';
import type { SpectatorPayload } from '../../engine/types/instance';
import { DEFAULT_GAME_STATS } from '../../engine/types';
import { PresenceRoster } from '../PresenceRoster';

function createMockPeerManager() {
  return {
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as PresenceTransport;
}

function getHandler(
  peerManager: PresenceTransport,
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
    userPalette: ['#ffffff'],
    stats: { ...DEFAULT_GAME_STATS },
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

  it('start() subscribes to presence transport events', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    expect(mockPeerManager.on).toHaveBeenCalledWith('peerJoined', expect.any(Function));
    expect(mockPeerManager.on).toHaveBeenCalledWith('peerLeft', expect.any(Function));
    expect(mockPeerManager.on).toHaveBeenCalledWith('data', expect.any(Function));
    expect(mockPeerManager.on).toHaveBeenCalledWith('presence', expect.any(Function));
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
    data(makePayload({ userId: 'user-1', stats: { ...DEFAULT_GAME_STATS, pps: 2.5 } }));

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

  it('presence event adds a new entry and marks it private', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const presence = getHandler(mockPeerManager, 'presence');
    presence(makeMetadata({ userId: 'user-9', displayName: 'Zed', isPrivate: true }));

    const entries = roster.getEntries();
    expect(entries[0]).toEqual({
      userId: 'user-9',
      displayName: 'Zed',
      isPrivate: true,
      pps: 0,
      isConnected: true,
      isLocal: false,
    });
    expect(roster.canSpectate('user-9')).toBe(false);
  });

  it('presence event flips an existing entry to private', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: 'user-1', displayName: 'Alice', isPrivate: false }));
    expect(roster.canSpectate('user-1')).toBe(true);

    const presence = getHandler(mockPeerManager, 'presence');
    presence(makeMetadata({ userId: 'user-1', displayName: 'Alice', isPrivate: true }));

    expect(roster.getEntries()[0]!.isPrivate).toBe(true);
    expect(roster.canSpectate('user-1')).toBe(false);
  });

  it('presence event preserves pps from a known entry', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: 'user-1', displayName: 'Alice' }));
    const data = getHandler(mockPeerManager, 'data');
    data(makePayload({ userId: 'user-1', stats: { ...DEFAULT_GAME_STATS, pps: 3.1 } }));

    const presence = getHandler(mockPeerManager, 'presence');
    presence(makeMetadata({ userId: 'user-1', displayName: 'Alice', isPrivate: true }));

    expect(roster.getEntries()[0]!.pps).toBe(3.1);
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

  it('removeEntry removes the entry and notifies listeners', () => {
    const roster = new PresenceRoster(mockPeerManager);
    const updateHandler = vi.fn();
    roster.onUpdate(updateHandler);

    roster.seedEntry(makeMetadata({ userId: 'discovered-1', displayName: 'Carol' }), false);
    updateHandler.mockClear();

    roster.removeEntry('discovered-1');

    expect(roster.getEntries()).toEqual([]);
    expect(updateHandler).toHaveBeenCalledTimes(1);
  });

  it('removeEntry on an unknown userId does not notify', () => {
    const roster = new PresenceRoster(mockPeerManager);
    const updateHandler = vi.fn();
    roster.onUpdate(updateHandler);

    roster.removeEntry('ghost');

    expect(updateHandler).not.toHaveBeenCalled();
  });

  it('reconcile removes seeded (unconnected) participants that left', () => {
    const roster = new PresenceRoster(mockPeerManager);

    roster.seedEntry(makeMetadata({ userId: 'present-user', displayName: 'Alice' }), false);
    roster.seedEntry(makeMetadata({ userId: 'gone-user', displayName: 'Bob' }), false);

    roster.reconcile(['present-user']);

    const userIds = roster.getEntries().map((entry) => entry.userId);
    expect(userIds).toEqual(['present-user']);
  });

  it('reconcile keeps connected entries even when absent from the participant list', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: 'connected-user', displayName: 'Zed' }));

    roster.reconcile([]);

    expect(roster.getEntries()).toHaveLength(1);
    expect(roster.getEntries()[0]!.userId).toBe('connected-user');
  });

  it('reconcile notifies listeners when entries are dropped', () => {
    const roster = new PresenceRoster(mockPeerManager);
    const updateHandler = vi.fn();
    roster.onUpdate(updateHandler);

    roster.seedEntry(makeMetadata({ userId: 'stale-user', displayName: 'Old' }), false);
    updateHandler.mockClear();

    roster.reconcile([]);

    expect(updateHandler).toHaveBeenCalledTimes(1);
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
    expect(mockPeerManager.off).toHaveBeenCalledWith('presence', expect.any(Function));
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

  it('does not clobber a usable display name when a rejoin brings a fallback name (the raw user id)', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: '123456789012345678', displayName: 'Alice' }));

    // Relay occasionally emits the fallback display name (the raw user id)
    // when its stored name is momentarily missing. The roster must keep the
    // known-good name instead of degrading to the number.
    joined(makeMetadata({ userId: '123456789012345678', displayName: '123456789012345678' }));

    expect(roster.getEntries()[0]!.displayName).toBe('Alice');
  });

  it('keeps the relay display name when no usable name is known yet', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: '123456789012345678', displayName: '123456789012345678' }));

    // Stored as-is; the PresenceRoster component is responsible for rendering a
    // neutral label rather than the raw id. The roster itself does not invent a name.
    expect(roster.getEntries()[0]!.displayName).toBe('123456789012345678');
    expect(roster.canSpectate('123456789012345678')).toBe(true);
  });

  it('does not clobber a usable display name on a presence refresh', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const joined = getHandler(mockPeerManager, 'peerJoined');
    const presence = getHandler(mockPeerManager, 'presence');
    joined(makeMetadata({ userId: '123456789012345678', displayName: 'Alice', isPrivate: false }));

    presence(makeMetadata({ userId: '123456789012345678', displayName: '123456789012345678', isPrivate: true }));

    expect(roster.getEntries()[0]!.displayName).toBe('Alice');
    expect(roster.getEntries()[0]!.isPrivate).toBe(true);
  });

  it('seedEntry upgrades a fallback name without downgrading connectivity', () => {
    const roster = new PresenceRoster(mockPeerManager);
    roster.start();

    const joined = getHandler(mockPeerManager, 'peerJoined');
    joined(makeMetadata({ userId: '123456789012345678', displayName: '123456789012345678' }));
    expect(roster.getEntries()[0]!.isConnected).toBe(true);

    // A later Discord participant discovery supplies the real name.
    roster.seedEntry(
      makeMetadata({ userId: '123456789012345678', displayName: 'Alice' }),
      false,
    );

    expect(roster.getEntries()[0]!.displayName).toBe('Alice');
    expect(roster.getEntries()[0]!.isConnected).toBe(true);
  });
});
