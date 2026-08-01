import type { IEngineCore } from '../engine/interfaces/IEngineCore';
import type { PeerJSManager } from './PeerJSManager';
import type { SpectatorPayload } from '../engine/types/instance';
import type { InstanceConfigStore } from './InstanceConfigStore';

const BROADCAST_INTERVAL_MS = 20;

export class HostBroadcaster {
  private readonly engine: IEngineCore;
  private readonly peerManager: PeerJSManager;
  private readonly configStore: InstanceConfigStore;
  private readonly userId: string;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(options: {
    engine: IEngineCore;
    peerManager: PeerJSManager;
    configStore: InstanceConfigStore;
    userId: string;
  }) {
    this.engine = options.engine;
    this.peerManager = options.peerManager;
    this.configStore = options.configStore;
    this.userId = options.userId;
  }

  start(): void {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => this.tick(), BROADCAST_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    if (this.configStore.getConfig().isPrivate) return;
    const state = this.engine.getState();
    const payload = this.toSpectatorPayload(state);
    this.peerManager.broadcast(payload);
  }

  private toSpectatorPayload(state: ReturnType<IEngineCore['getState']>): SpectatorPayload {
    return {
      userId: this.userId,
      matrix: state.board,
      activePiece: state.activePiece
        ? {
            type: state.activePiece.type,
            x: state.activePiece.x,
            y: state.activePiece.y,
            r: state.activePiece.rotation,
          }
        : null,
      queue: state.queue,
      hold: state.hold,
      annotations: state.annotations,
      stats: {
        pps: state.stats.pps,
        apm: state.stats.apm,
        kpp: state.stats.kpp,
        piecesPlaced: state.stats.piecesPlaced,
        linesCleared: state.stats.linesCleared,
      },
    };
  }
}