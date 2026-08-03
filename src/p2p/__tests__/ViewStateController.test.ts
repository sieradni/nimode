import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PresenceRoster, PresenceEntry } from '../PresenceRoster';
import type { SpectatorBuffer } from '../SpectatorBuffer';
import { ViewStateController } from '../ViewStateController';

function createMockRoster() {
  const canSpectate = vi.fn();
  const onUpdate = vi.fn();
  const roster = {
    canSpectate,
    onUpdate,
  } as unknown as PresenceRoster;
  return { roster, canSpectate, onUpdate };
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
  let onUpdate: ReturnType<typeof vi.fn>;
  let buffer: SpectatorBuffer;
  let setTarget: ReturnType<typeof vi.fn>;
  let connectToTarget: ReturnType<typeof vi.fn>;
  let controller: ViewStateController;

  beforeEach(() => {
    vi.useFakeTimers();
    const rosterMock = createMockRoster();
    roster = rosterMock.roster;
    canSpectate = rosterMock.canSpectate;
    onUpdate = rosterMock.onUpdate;
    const bufferMock = createMockBuffer();
    buffer = bufferMock.buffer;
    setTarget = bufferMock.setTarget;
    connectToTarget = vi.fn();
    controller = new ViewStateController({ roster, buffer, connectToTarget });
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('auto-returns to local when the spectated target becomes private after grace period', () => {
    canSpectate.mockReturnValue(true);
    controller.selectTarget('user-1');

    const listener = vi.fn();
    controller.onViewChange(listener);

    const updateHandler = onUpdate.mock.calls[0]?.[0] as (
      entries: PresenceEntry[],
    ) => void;
    updateHandler([
      { userId: 'user-1', displayName: 'Bob', isPrivate: true, pps: 0, isConnected: true, isLocal: false },
    ]);

    expect(controller.getView()).toBe('SPECTATING_TARGET');

    vi.advanceTimersByTime(3000);

    expect(controller.getView()).toBe('LOCAL_ACTIVE');
    expect(controller.getTargetId()).toBeNull();
    expect(listener).toHaveBeenCalledWith('LOCAL_ACTIVE');
    expect(setTarget).toHaveBeenCalledWith(null);
  });

  it('keeps spectating when the target remains public', () => {
    canSpectate.mockReturnValue(true);
    controller.selectTarget('user-1');

    const updateHandler = onUpdate.mock.calls[0]?.[0] as (
      entries: PresenceEntry[],
    ) => void;
    updateHandler([
      { userId: 'user-1', displayName: 'Bob', isPrivate: false, pps: 12, isConnected: true, isLocal: false },
    ]);

    expect(controller.getView()).toBe('SPECTATING_TARGET');
    expect(controller.getTargetId()).toBe('user-1');
    expect(setTarget).not.toHaveBeenCalledWith(null);
  });

  it('auto-returns to local when the spectated target disconnects from the roster after grace period', () => {
    canSpectate.mockReturnValue(true);
    controller.selectTarget('user-1');

    const listener = vi.fn();
    controller.onViewChange(listener);

    const updateHandler = onUpdate.mock.calls[0]?.[0] as (
      entries: PresenceEntry[],
    ) => void;
    updateHandler([]);

    expect(controller.getView()).toBe('SPECTATING_TARGET');

    vi.advanceTimersByTime(3000);

    expect(controller.getView()).toBe('LOCAL_ACTIVE');
    expect(controller.getTargetId()).toBeNull();
    expect(listener).toHaveBeenCalledWith('LOCAL_ACTIVE');
    expect(setTarget).toHaveBeenLastCalledWith(null);
  });

  it('cancels the return-to-local grace period when the target reappears', () => {
    canSpectate.mockReturnValue(true);
    controller.selectTarget('user-1');

    const updateHandler = onUpdate.mock.calls[0]?.[0] as (
      entries: PresenceEntry[],
    ) => void;
    updateHandler([]);

    vi.advanceTimersByTime(1500);

    updateHandler([
      { userId: 'user-1', displayName: 'Bob', isPrivate: false, pps: 12, isConnected: true, isLocal: false },
    ]);

    vi.advanceTimersByTime(3000);

    expect(controller.getView()).toBe('SPECTATING_TARGET');
    expect(controller.getTargetId()).toBe('user-1');
  });
});
