import { describe, it, expect, vi } from 'vitest';
import { EditSession } from '../editSession';

function createOptions(overrides: Partial<Parameters<EditSession['commit']>[0]> = {}) {
  return {
    cells: [{ x: 1, y: 1 }],
    autoColorEnabled: false,
    applyStrokeAutoColor: vi.fn(),
    saveSnapshot: vi.fn(),
    ...overrides,
  };
}

describe('EditSession', () => {
  it('does not snapshot when nothing was edited', () => {
    const session = new EditSession();
    const options = createOptions();
    session.begin('annotations');
    session.commit(options);
    expect(options.saveSnapshot).not.toHaveBeenCalled();
  });

  it('snapshots exactly once when edits were made', () => {
    const session = new EditSession();
    const options = createOptions();
    session.begin('annotations');
    session.markDirty();
    session.markDirty();
    session.commit(options);
    expect(options.saveSnapshot).toHaveBeenCalledTimes(1);
  });

  it('resets after commit so the next gesture snapshots independently', () => {
    const session = new EditSession();
    const first = createOptions();
    const second = createOptions();
    session.begin('blocks');
    session.markDirty();
    session.commit(first);
    session.begin('blocks');
    session.commit(second);
    expect(first.saveSnapshot).toHaveBeenCalledTimes(1);
    expect(second.saveSnapshot).not.toHaveBeenCalled();
  });

  it('applies stroke auto-color in annotation mode when enabled', () => {
    const session = new EditSession();
    const options = createOptions({ autoColorEnabled: true });
    session.begin('annotations');
    session.markDirty();
    session.commit(options);
    expect(options.applyStrokeAutoColor).toHaveBeenCalledWith(options.cells);
  });

  it('applies stroke auto-color in block mode too', () => {
    const session = new EditSession();
    const options = createOptions({ autoColorEnabled: true });
    session.begin('blocks');
    session.markDirty();
    session.commit(options);
    expect(options.applyStrokeAutoColor).toHaveBeenCalledWith(options.cells);
  });

  it('does not apply stroke auto-color when no gesture is open', () => {
    const session = new EditSession();
    const options = createOptions({ autoColorEnabled: true });
    session.commit(options);
    expect(options.applyStrokeAutoColor).not.toHaveBeenCalled();
  });

  it('does not apply stroke auto-color when no cells were touched', () => {
    const session = new EditSession();
    const options = createOptions({ autoColorEnabled: true, cells: [] });
    session.begin('annotations');
    session.markDirty();
    session.commit(options);
    expect(options.applyStrokeAutoColor).not.toHaveBeenCalled();
  });

  it('tracks the active mode', () => {
    const session = new EditSession();
    expect(session.isActive()).toBe(false);
    session.begin('annotations');
    expect(session.isActive()).toBe(true);
    expect(session.getMode()).toBe('annotations');
  });
});
