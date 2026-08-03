import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KeyboardInputAdapter, actionToInputEvent } from '../keyboardInput';
import { KeyBindings, InputAction } from '../types';

const BINDINGS: KeyBindings = {
  MOVE_LEFT: 'ArrowLeft',
  MOVE_RIGHT: 'ArrowRight',
  SOFT_DROP: 'ArrowDown',
  HARD_DROP: 'Space',
  ROTATE_CW: 'KeyC',
  ROTATE_CCW: 'KeyZ',
  ROTATE_180: 'KeyV',
  HOLD: 'KeyX',
  RESET: 'KeyR',
  UNDO: 'KeyU',
  REDO: 'KeyY',
};

function createResolve(bindings: KeyBindings = BINDINGS) {
  return (event: { code: string }): InputAction | null => {
    const entries = Object.entries(bindings) as [InputAction, string][];
    for (const [action, code] of entries) {
      if (code === event.code) {
        return action;
      }
    }
    return null;
  };
}

function dispatchKey(type: 'keydown' | 'keyup', code: string, repeat = false): void {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true, repeat }));
}

describe('actionToInputEvent', () => {
  it('maps held actions with a pressed flag', () => {
    expect(actionToInputEvent('MOVE_LEFT', true)).toEqual({ type: 'MOVE_LEFT', pressed: true });
    expect(actionToInputEvent('MOVE_LEFT', false)).toEqual({ type: 'MOVE_LEFT', pressed: false });
    expect(actionToInputEvent('SOFT_DROP', true)).toEqual({ type: 'SOFT_DROP', pressed: true });
  });

  it('maps one-time actions only when pressed', () => {
    expect(actionToInputEvent('HARD_DROP', true)).toEqual({ type: 'HARD_DROP' });
    expect(actionToInputEvent('HARD_DROP', false)).toBeNull();
    expect(actionToInputEvent('ROTATE_CW', true)).toEqual({ type: 'ROTATE_CW' });
    expect(actionToInputEvent('ROTATE_CW', false)).toBeNull();
    expect(actionToInputEvent('RESET', true)).toEqual({ type: 'RESET' });
  });
});

describe('KeyboardInputAdapter', () => {
  let onInput: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onInput = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards a held action keydown as pressed', () => {
    const adapter = new KeyboardInputAdapter({ onInput, resolveAction: createResolve() });
    adapter.attach();
    dispatchKey('keydown', 'ArrowLeft');
    expect(onInput).toHaveBeenCalledWith({ type: 'MOVE_LEFT', pressed: true });
    adapter.detach();
  });

  it('forwards a held action keyup as released', () => {
    const adapter = new KeyboardInputAdapter({ onInput, resolveAction: createResolve() });
    adapter.attach();
    dispatchKey('keyup', 'ArrowLeft');
    expect(onInput).toHaveBeenCalledWith({ type: 'MOVE_LEFT', pressed: false });
    adapter.detach();
  });

  it('forwards a one-time action on keydown', () => {
    const adapter = new KeyboardInputAdapter({ onInput, resolveAction: createResolve() });
    adapter.attach();
    dispatchKey('keydown', 'Space');
    expect(onInput).toHaveBeenCalledWith({ type: 'HARD_DROP' });
    adapter.detach();
  });

  it('does not forward a one-time action on keyup', () => {
    const adapter = new KeyboardInputAdapter({ onInput, resolveAction: createResolve() });
    adapter.attach();
    dispatchKey('keyup', 'Space');
    expect(onInput).not.toHaveBeenCalled();
    adapter.detach();
  });

  it('ignores unbound keys', () => {
    const adapter = new KeyboardInputAdapter({ onInput, resolveAction: createResolve() });
    adapter.attach();
    dispatchKey('keydown', 'KeyQ');
    expect(onInput).not.toHaveBeenCalled();
    adapter.detach();
  });

  it('ignores repeated keydown of one-time actions', () => {
    const adapter = new KeyboardInputAdapter({ onInput, resolveAction: createResolve() });
    adapter.attach();
    dispatchKey('keydown', 'Space', true);
    expect(onInput).not.toHaveBeenCalled();
    adapter.detach();
  });

  it('still forwards repeated keydown of held actions', () => {
    const adapter = new KeyboardInputAdapter({ onInput, resolveAction: createResolve() });
    adapter.attach();
    dispatchKey('keydown', 'ArrowLeft', true);
    expect(onInput).toHaveBeenCalledWith({ type: 'MOVE_LEFT', pressed: true });
    adapter.detach();
  });

  it('does not forward input while disabled', () => {
    const adapter = new KeyboardInputAdapter({
      onInput,
      resolveAction: createResolve(),
      isEnabled: () => false,
    });
    adapter.attach();
    dispatchKey('keydown', 'ArrowLeft');
    expect(onInput).not.toHaveBeenCalled();
    adapter.detach();
  });

  it('stops forwarding after detach', () => {
    const adapter = new KeyboardInputAdapter({ onInput, resolveAction: createResolve() });
    adapter.attach();
    adapter.detach();
    dispatchKey('keydown', 'ArrowLeft');
    expect(onInput).not.toHaveBeenCalled();
  });

   it('resolves actions through the real keybindingsStore by default', () => {
     const adapter = new KeyboardInputAdapter({ onInput });
     adapter.attach();
     dispatchKey('keydown', 'KeyX');
     expect(onInput).toHaveBeenCalledWith({ type: 'ROTATE_CW' });
     adapter.detach();
   });

  it('keeps native behaviour for keys typed into an input element', () => {
    const adapter = new KeyboardInputAdapter({ onInput, resolveAction: createResolve() });
    adapter.attach();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft', bubbles: true }));

    expect(onInput).not.toHaveBeenCalled();
    input.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft', bubbles: true }));
    expect(onInput).not.toHaveBeenCalled();
    input.remove();
    adapter.detach();
  });

  it('keeps native behaviour for keys inside a textarea element', () => {
    const adapter = new KeyboardInputAdapter({ onInput, resolveAction: createResolve() });
    adapter.attach();

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', bubbles: true }));

    expect(onInput).not.toHaveBeenCalled();
    textarea.remove();
    adapter.detach();
  });

  it('keeps native behaviour for keys inside a contenteditable element', () => {
    const adapter = new KeyboardInputAdapter({ onInput, resolveAction: createResolve() });
    adapter.attach();

    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    document.body.appendChild(editable);
    editable.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));

    expect(onInput).not.toHaveBeenCalled();
    editable.remove();
    adapter.detach();
  });
});
