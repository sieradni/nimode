import type { EditMode } from './types/annotations';

export interface EditCommitOptions {
  cells: ReadonlyArray<{ x: number; y: number }>;
  autoColorEnabled: boolean;
  applyStrokeAutoColor(cells: ReadonlyArray<{ x: number; y: number }>): void;
  saveSnapshot(): void;
}

/**
 * Groups the per-cell events of one pointer gesture (a pen drag, a right-drag
 * erase, a rect fill) into a single undoable action.
 *
 * `begin` opens the session for the active layer; every mutating edit event
 * marks it dirty; `commit` folds stroke auto-color (annotation mode only)
 * into the same action and pushes exactly one undo snapshot when anything
 * changed. A gesture therefore undoes as one step instead of one step per
 * painted cell (US-1.12).
 */
export class EditSession {
  private mode: EditMode | null = null;
  private dirty = false;

  begin(mode: EditMode): void {
    this.mode = mode;
    this.dirty = false;
  }

  isActive(): boolean {
    return this.mode !== null;
  }

  getMode(): EditMode | null {
    return this.mode;
  }

  markDirty(): void {
    this.dirty = true;
  }

  commit(options: EditCommitOptions): void {
    const mode = this.mode;
    if (mode === 'annotations' && options.autoColorEnabled && options.cells.length > 0) {
      options.applyStrokeAutoColor(options.cells);
    }
    if (this.dirty) {
      options.saveSnapshot();
    }
    this.mode = null;
    this.dirty = false;
  }
}
