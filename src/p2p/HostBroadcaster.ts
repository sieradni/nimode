import type { IEngineCore } from '../engine/interfaces/IEngineCore';
import type { PeerJSManager } from './PeerJSManager';
import type { InstanceConfig } from '../engine/types/game';
import type { SpectatorPayload } from '../engine/types/game';

const BROADCAST_INTERVAL_MS = 50;

export class HostBroadcaster {
  private readonly engine: IEngineCore;
  private readonly peerManager: PeerJSManager;
  private readonly instanceConfig: InstanceConfig;
  private readonly userId: string;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(options: {
    engine: IEngineCore;
    peerManager: PeerJSManager;
    instanceConfig: InstanceConfig;
    userId: string;
  }) {
    this.engine = options.engine;
    this.peerManager = options.peerManager;
    this.instanceConfig = options.instanceConfig;
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
    if (this.instanceConfig.isPrivate) return;
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
      annotations: [],
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