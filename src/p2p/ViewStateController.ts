import type { PresenceRoster } from './PresenceRoster';
import type { SpectatorBuffer } from './SpectatorBuffer';

export type ActiveView = 'LOCAL_ACTIVE' | 'SPECTATING_TARGET';

export class ViewStateController {
  private readonly roster: PresenceRoster;
  private readonly buffer: SpectatorBuffer;
  private view: ActiveView = 'LOCAL_ACTIVE';
  private targetId: string | null = null;
  private readonly listeners = new Set<(view: ActiveView) => void>();

  constructor(options: { roster: PresenceRoster; buffer: SpectatorBuffer }) {
    this.roster = options.roster;
    this.buffer = options.buffer;
  }

  getView(): ActiveView {
    return this.view;
  }

  getTargetId(): string | null {
    return this.targetId;
  }

  selectTarget(userId: string): boolean {
    if (!this.roster.canSpectate(userId)) {
      return false;
    }
    this.buffer.clear();
    this.targetId = userId;
    this.view = 'SPECTATING_TARGET';
    this.notify();
    return true;
  }

  returnToLocal(): void {
    this.targetId = null;
    this.view = 'LOCAL_ACTIVE';
    this.notify();
  }

  onViewChange(fn: (view: ActiveView) => void): void {
    this.listeners.add(fn);
  }

  offViewChange(fn: (view: ActiveView) => void): void {
    this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.view));
  }
}
