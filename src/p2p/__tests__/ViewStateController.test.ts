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
  const setTarget = vi.fn();
  const buffer = {
    setTarget,
  } as unknown as SpectatorBuffer;
  return { buffer, setTarget };
}

describe('ViewStateController', () => {
  let roster: PresenceRoster;
  let canSpectate: ReturnType<typeof vi.fn>;
  let buffer: SpectatorBuffer;
  let setTarget: ReturnType<typeof vi.fn>;
  let connectToTarget: ReturnType<typeof vi.fn>;
  let controller: ViewStateController;

  beforeEach(() => {
    const rosterMock = createMockRoster();
    roster = rosterMock.roster;
    canSpectate = rosterMock.canSpectate;
    const bufferMock = createMockBuffer();
    buffer = bufferMock.buffer;
    setTarget = bufferMock.setTarget;
    connectToTarget = vi.fn();
    controller = new ViewStateController({ roster, buffer, connectToTarget });
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
    expect(setTarget).toHaveBeenCalledWith('user-1');
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
    expect(setTarget).not.toHaveBeenCalled();
  });

  it('selectTarget on an unknown user is blocked', () => {
    canSpectate.mockReturnValue(false);

    const result = controller.selectTarget('ghost');

    expect(result).toBe(false);
    expect(controller.getView()).toBe('LOCAL_ACTIVE');
    expect(controller.getTargetId()).toBeNull();
    expect(setTarget).not.toHaveBeenCalled();
  });

  it('opens an outbound connection to the spectated target', () => {
    canSpectate.mockReturnValue(true);

    controller.selectTarget('user-1');

    expect(connectToTarget).toHaveBeenCalledWith('user-1');
  });

  it('does not open a connection when spectating is blocked', () => {
    canSpectate.mockReturnValue(false);

    controller.selectTarget('user-1');

    expect(connectToTarget).not.toHaveBeenCalled();
  });

  it('returnToLocal restores LOCAL_ACTIVE and clears the target', () => {
    canSpectate.mockReturnValue(true);
    controller.selectTarget('user-1');

    const listener = vi.fn();
    controller.onViewChange(listener);

    controller.returnToLocal();

    expect(controller.getView()).toBe('LOCAL_ACTIVE');
    expect(controller.getTargetId()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('LOCAL_ACTIVE');
    expect(setTarget).toHaveBeenCalledWith(null);
  });

  it('switching targets re-targets the buffer', () => {
    canSpectate.mockReturnValue(true);

    controller.selectTarget('user-1');
    expect(setTarget).toHaveBeenLastCalledWith('user-1');

    controller.selectTarget('user-2');

    expect(controller.getTargetId()).toBe('user-2');
    expect(setTarget).toHaveBeenLastCalledWith('user-2');
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
    expect(setTarget).toHaveBeenCalledTimes(1);
  });
});
