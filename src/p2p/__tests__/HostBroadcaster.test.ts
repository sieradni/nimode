import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { IEngineCore, EngineState } from '../../engine/interfaces/IEngineCore';
import { HostBroadcaster } from '../HostBroadcaster';
import type { SpectatorPayload } from '../../engine/types/game';
import type { InstanceConfig } from '../../engine/types/game';
import type { PeerJSManager } from '../PeerJSManager';

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
    },
    gameOver: false,
    paused: false,
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

const DEFAULT_INSTANCE_CONFIG: InstanceConfig = { isPrivate: false };
const USER_ID = 'test-user';

describe('HostBroadcaster', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not broadcast when instance is private', () => {
    const engine = makeMockEngine();
    const { peerManager, broadcast } = makeMockPeerManager();
    const privateConfig: InstanceConfig = { isPrivate: true };
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      instanceConfig: privateConfig,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(50);

    expect(broadcast).not.toHaveBeenCalled();
    broadcaster.stop();
  });

  it('broadcasts at 20 Hz when instance is public', () => {
    const engine = makeMockEngine();
    const { peerManager, broadcast } = makeMockPeerManager();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      instanceConfig: DEFAULT_INSTANCE_CONFIG,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(50);

    expect(broadcast).toHaveBeenCalledTimes(1);
    broadcaster.stop();
  });

  it('broadcasts multiple times at 20 Hz intervals', () => {
    const engine = makeMockEngine();
    const { peerManager, broadcast } = makeMockPeerManager();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      instanceConfig: DEFAULT_INSTANCE_CONFIG,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(200);

    expect(broadcast).toHaveBeenCalledTimes(4);
    broadcaster.stop();
  });

  it('stops broadcasting when stop is called', () => {
    const engine = makeMockEngine();
    const { peerManager, broadcast } = makeMockPeerManager();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      instanceConfig: DEFAULT_INSTANCE_CONFIG,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(100);
    expect(broadcast).toHaveBeenCalledTimes(2);

    broadcaster.stop();
    vi.advanceTimersByTime(100);
    expect(broadcast).toHaveBeenCalledTimes(2);
  });

  it('does not create duplicate intervals when started twice', () => {
    const engine = makeMockEngine();
    const { peerManager, broadcast } = makeMockPeerManager();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      instanceConfig: DEFAULT_INSTANCE_CONFIG,
      userId: USER_ID,
    });

    broadcaster.start();
    broadcaster.start();
    vi.advanceTimersByTime(50);

    expect(broadcast).toHaveBeenCalledTimes(1);
    broadcaster.stop();
  });

  it('broadcasts payload with correct structure and userId', () => {
    const engine = makeMockEngine();
    const { peerManager, broadcast } = makeMockPeerManager();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      instanceConfig: DEFAULT_INSTANCE_CONFIG,
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
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      instanceConfig: DEFAULT_INSTANCE_CONFIG,
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
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      instanceConfig: DEFAULT_INSTANCE_CONFIG,
      userId: USER_ID,
    });

    broadcaster.start();
    vi.advanceTimersByTime(50);

    const call = (broadcast as ReturnType<typeof vi.fn>).mock.calls[0]![0] as SpectatorPayload;
    expect(call.activePiece).toEqual({ type: 1, x: 3, y: 20, r: 2 });
    broadcaster.stop();
  });

  it('payload maps stats fields correctly', () => {
    const engine = makeMockEngine(
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
        },
      })
    );
    const { peerManager, broadcast } = makeMockPeerManager();
    const broadcaster = new HostBroadcaster({
      engine,
      peerManager,
      instanceConfig: DEFAULT_INSTANCE_CONFIG,
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
    broadcaster.stop();
  });
});