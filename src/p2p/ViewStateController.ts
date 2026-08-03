import type { PresenceRoster, PresenceEntry } from './PresenceRoster';
import type { SpectatorBuffer } from './SpectatorBuffer';

export type ActiveView = 'LOCAL_ACTIVE' | 'SPECTATING_TARGET';

const GRACE_PERIOD_MS = 3000;

export class ViewStateController {
  private readonly roster: PresenceRoster;
  private readonly buffer: SpectatorBuffer;
  private readonly connectToTarget: ((userId: string) => void) | null;
  private view: ActiveView = 'LOCAL_ACTIVE';
  private targetId: string | null = null;
  private readonly listeners = new Set<(view: ActiveView) => void>();
  private graceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: {
    roster: PresenceRoster;
    buffer: SpectatorBuffer;
    connectToTarget?: (userId: string) => void;
  }) {
    this.roster = options.roster;
    this.buffer = options.buffer;
    this.connectToTarget = options.connectToTarget ?? null;
    this.roster.onUpdate(this.handleRosterUpdate);
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
    this.buffer.setTarget(userId);
    this.targetId = userId;
    this.view = 'SPECTATING_TARGET';
    this.connectToTarget?.(userId);
    this.notify();
    return true;
  }

  returnToLocal(): void {
    if (this.graceTimer !== null) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
    this.buffer.setTarget(null);
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

  private handleRosterUpdate = (entries: PresenceEntry[]): void => {
    if (this.view !== 'SPECTATING_TARGET' || this.targetId === null) return;
    const target = entries.find((entry) => entry.userId === this.targetId);
    if (!target || target.isPrivate) {
      if (this.graceTimer === null) {
        this.graceTimer = setTimeout(() => {
          this.graceTimer = null;
          this.returnToLocal();
        }, GRACE_PERIOD_MS);
      }
    } else {
      if (this.graceTimer !== null) {
        clearTimeout(this.graceTimer);
        this.graceTimer = null;
      }
    }
  };
}
