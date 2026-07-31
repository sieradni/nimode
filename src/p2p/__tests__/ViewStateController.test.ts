import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PresenceRoster } from '../PresenceRoster';
import type { SpectatorBuffer } from '../SpectatorBuffer';
import { ViewStateController } from '../ViewStateController';

function createMockRoster() {
  const canSpectate = vi.fn();
  const roster = {
    canSpectate,
  } as unknown as PresenceRoster;
  return { roster, canSpectate };
}

function createMockBuffer() {
  const clear = vi.fn();
  const buffer = {
    clear,
  } as unknown as SpectatorBuffer;
  return { buffer, clear };
}

describe('ViewStateController', () => {
  let roster: PresenceRoster;
  let canSpectate: ReturnType<typeof vi.fn>;
  let buffer: SpectatorBuffer;
  let clear: ReturnType<typeof vi.fn>;
  let controller: ViewStateController;
  beforeEach(() => {
    const rosterMock = createMockRoster();
    roster = rosterMock.roster;
    canSpectate = rosterMock.canSpectate;
    const bufferMock = createMockBuffer();
    buffer = bufferMock.buffer;
    clear = bufferMock.clear;
    controller = new ViewStateController({ roster, buffer });
  });

  it('starts in LOCAL_ACTIVE with null target', () => {
    expect(controller.getView()).toBe('LOCAL_ACTIVE');
    expect(controller.getTargetId()).toBeNull();
  });

  it('selectTarget on a spectatable user switches to SPECTATING_TARGET', () => {
    canSpectate.mockReturnValue(true);

    const listener = vi.fn();
    controller.onViewChange(listener);

    const result = controller.selectTarget('user-1');

    expect(result).toBe(true);
    expect(controller.getView()).toBe('SPECTATING_TARGET');
    expect(controller.getTargetId()).toBe('user-1');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('SPECTATING_TARGET');
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('selectTarget on a private user is blocked', () => {
    canSpectate.mockReturnValue(false);

    const listener = vi.fn();
    controller.onViewChange(listener);

    const result = controller.selectTarget('user-1');

    expect(result).toBe(false);
    expect(controller.getView()).toBe('LOCAL_ACTIVE');
    expect(controller.getTargetId()).toBeNull();
    expect(listener).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
  });

  it('selectTarget on an unknown user is blocked', () => {
    canSpectate.mockReturnValue(false);

    const result = controller.selectTarget('ghost');

    expect(result).toBe(false);
    expect(controller.getView()).toBe('LOCAL_ACTIVE');
    expect(controller.getTargetId()).toBeNull();
    expect(clear).not.toHaveBeenCalled();
  });

  it('returnToLocal restores LOCAL_ACTIVE and clears target', () => {
    canSpectate.mockReturnValue(true);
    controller.selectTarget('user-1');

    const listener = vi.fn();
    controller.onViewChange(listener);

    controller.returnToLocal();

    expect(controller.getView()).toBe('LOCAL_ACTIVE');
    expect(controller.getTargetId()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('LOCAL_ACTIVE');
  });

  it('switching targets clears the buffer again', () => {
    canSpectate.mockReturnValue(true);

    controller.selectTarget('user-1');
    expect(clear).toHaveBeenCalledTimes(1);

    controller.selectTarget('user-2');

    expect(controller.getTargetId()).toBe('user-2');
    expect(clear).toHaveBeenCalledTimes(2);
  });

  it('onViewChange/offViewChange add and remove listeners', () => {
    canSpectate.mockReturnValue(true);

    const listener = vi.fn();
    controller.onViewChange(listener);
    controller.offViewChange(listener);

    controller.selectTarget('user-1');

    expect(listener).not.toHaveBeenCalled();
  });

  it('blocked selectTarget while spectating keeps previous state intact', () => {
    canSpectate.mockReturnValue(true);
    controller.selectTarget('user-1');

    canSpectate.mockReturnValue(false);
    const listener = vi.fn();
    controller.onViewChange(listener);

    const result = controller.selectTarget('user-2');

    expect(result).toBe(false);
    expect(controller.getView()).toBe('SPECTATING_TARGET');
    expect(controller.getTargetId()).toBe('user-1');
    expect(listener).not.toHaveBeenCalled();
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('does not clear the buffer on returnToLocal', () => {
    canSpectate.mockReturnValue(true);
    controller.selectTarget('user-1');

    clear.mockClear();
    controller.returnToLocal();

    expect(clear).not.toHaveBeenCalled();
  });
});