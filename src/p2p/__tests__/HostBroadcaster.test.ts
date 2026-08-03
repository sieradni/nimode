import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { IEngineCore, EngineState } from '../../engine/interfaces/IEngineCore';
import { HostBroadcaster } from '../HostBroadcaster';
import type { SpectatorPayload } from '../../engine/types/instance';
import type { PeerJSManager } from '../PeerJSManager';
import { InstanceConfigStore } from '../InstanceConfigStore';

function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

function makeEngineState(overrides: Partial<EngineState> = {}): EngineState {
  return {
    board: Array.from({ length: 40 }, () => Array(10).fill(0)),
    activePiece: null,
    queue: [],
    hold: null,
    canHold: true,
    stats: {
      piecesPlaced: 0,
      linesCleared: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      quads: 0,
      tSpins: 0,
      tSpinMinis: 0,
      pps: 0,
      apm: 0,
      kpp: 0,
      finesse: 0,
      efficiency: 0,
      attack: 0,
      time: 0,
    },
    gameOver: false,
    paused: false,
    annotations: Array.from({ length: 40 }, () => Array(10).fill(0)),
    userPalette: ['#ffffff'],
    bagRemaining: 7,
    ...overrides,
  };
}

function makeMockEngine(
  state: EngineState = makeEngineState()
): IEngineCore {
  return {
    initialize: vi.fn(),
    tick: vi.fn(),
    handleInput: vi.fn(),
    getState: vi.fn(() => state),
    reset: vi.fn(),
    setQueue: vi.fn(),
    setPaused: vi.fn(),
  } as unknown as IEngineCore;
}

function makeMockPeerManager(): {
  peerManager: PeerJSManager;
  broadcast: ReturnType<typeof vi.fn>;
} {
  const broadcast = vi.fn();
  const peerManager = {
    id: 'mock-host',
    role: 'host',
    open: true,
    init: vi.fn(),
    broadcast,
    on: vi.fn(),
    off: vi.fn(),
    close: vi.fn(),
  } as unknown as PeerJSManager;
  return { peerManager, broadcast };
}

const USER_ID = 'test-user';

describe('HostBroadcaster', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('localStorage', createMockStorage());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('does not broadcast when instance is private', () => {
    const engine = makeMockEngine();
    const { peerManager, broadcast } = makeMockPeerManager();
    const configStore = new InstanceConfigStore();
    configStore.setPrivate(true);
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      configStore,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(50);

    expect(broadcast).not.toHaveBeenCalled();
    broadcaster.stop();
  });

  it('broadcasts at 50 Hz when instance is public', () => {
    const engine = makeMockEngine();
    const { peerManager, broadcast } = makeMockPeerManager();
    const configStore = new InstanceConfigStore();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      configStore,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(20);

    expect(broadcast).toHaveBeenCalledTimes(1);
    broadcaster.stop();
  });

  it('broadcasts multiple times at 50 Hz intervals', () => {
    const engine = makeMockEngine();
    const { peerManager, broadcast } = makeMockPeerManager();
    const configStore = new InstanceConfigStore();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      configStore,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(100);

    expect(broadcast).toHaveBeenCalledTimes(5);
    broadcaster.stop();
  });

  it('stops broadcasting when stop is called', () => {
    const engine = makeMockEngine();
    const { peerManager, broadcast } = makeMockPeerManager();
    const configStore = new InstanceConfigStore();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      configStore,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(100);
    expect(broadcast).toHaveBeenCalledTimes(5);

    broadcaster.stop();
    vi.advanceTimersByTime(100);
    expect(broadcast).toHaveBeenCalledTimes(5);
  });

  it('does not create duplicate intervals when started twice', () => {
    const engine = makeMockEngine();
    const { peerManager, broadcast } = makeMockPeerManager();
    const configStore = new InstanceConfigStore();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      configStore,
      userId: USER_ID,
    });

    broadcaster.start();
    broadcaster.start();
    vi.advanceTimersByTime(20);

    expect(broadcast).toHaveBeenCalledTimes(1);
    broadcaster.stop();
  });

  it('broadcasts payload with correct structure and userId', () => {
    const engine = makeMockEngine();
    const { peerManager, broadcast } = makeMockPeerManager();
    const configStore = new InstanceConfigStore();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      configStore,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(50);

    const call = (broadcast as ReturnType<typeof vi.fn>).mock.calls[0]![0] as SpectatorPayload;
    expect(call.userId).toBe(USER_ID);
    expect(call.matrix).toBeDefined();
    expect(call.queue).toBeDefined();
    expect(call.hold).toBeDefined();
    expect(call.annotations).toBeDefined();
    expect(call.stats).toBeDefined();
    broadcaster.stop();
  });

  it('payload has null activePiece when no piece is active', () => {
    const engine = makeMockEngine(makeEngineState({ activePiece: null }));
    const { peerManager, broadcast } = makeMockPeerManager();
    const configStore = new InstanceConfigStore();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      configStore,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(50);

    const call = (broadcast as ReturnType<typeof vi.fn>).mock.calls[0]![0] as SpectatorPayload;
    expect(call.activePiece).toBeNull();
    broadcaster.stop();
  });

  it('payload maps activePiece fields correctly', () => {
    const engine = makeMockEngine(
      makeEngineState({
        activePiece: { type: 1, x: 3, y: 20, rotation: 2 },
      })
    );
    const { peerManager, broadcast } = makeMockPeerManager();
    const configStore = new InstanceConfigStore();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      configStore,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(50);

    const call = (broadcast as ReturnType<typeof vi.fn>).mock.calls[0]![0] as SpectatorPayload;
    expect(call.activePiece).toEqual({ type: 1, x: 3, y: 20, r: 2 });
    broadcaster.stop();
  });

  it('payload maps stats fields correctly', () => {
    const     engine = makeMockEngine(
      makeEngineState({
        stats: {
          piecesPlaced: 42,
          linesCleared: 7,
          pps: 2.5,
          apm: 30,
          kpp: 1.2,
          singles: 0,
          doubles: 0,
          triples: 0,
          quads: 0,
          tSpins: 0,
          tSpinMinis: 0,
          finesse: 0,
          efficiency: 0,
          attack: 0,
          time: 5,
        },
      })
    );
    const { peerManager, broadcast } = makeMockPeerManager();
    const configStore = new InstanceConfigStore();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      configStore,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(50);

    const call = (broadcast as ReturnType<typeof vi.fn>).mock.calls[0]![0] as SpectatorPayload;
    expect(call.stats.pps).toBe(2.5);
    expect(call.stats.apm).toBe(30);
    expect(call.stats.kpp).toBe(1.2);
    expect(call.stats.piecesPlaced).toBe(42);
    expect(call.stats.linesCleared).toBe(7);
    expect(call.stats.time).toBe(5);
    broadcaster.stop();
  });

  it('dynamically stops broadcasting when privacy toggled mid-run', () => {
    const engine = makeMockEngine();
    const { peerManager, broadcast } = makeMockPeerManager();
    const configStore = new InstanceConfigStore();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      configStore,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(20);
    expect(broadcast).toHaveBeenCalledTimes(1);

    configStore.setPrivate(true);
    vi.advanceTimersByTime(100);
    expect(broadcast).toHaveBeenCalledTimes(1);

    configStore.setPrivate(false);
    vi.advanceTimersByTime(20);
    expect(broadcast).toHaveBeenCalledTimes(2);

    broadcaster.stop();
  });
});
