import { describe, it, expect, beforeEach } from 'vitest';
import { KeybindingsStore } from '../keybindingsStore';
import { DEFAULT_KEYBINDINGS } from '../types';
import { formatBinding, parseBinding, eventToBindingCode } from '../keybindingCodes';

describe('keybinding defaults', () => {
  it('uses the standard Tetris rotation layout (Z=CCW, X=CW)', () => {
    expect(DEFAULT_KEYBINDINGS.ROTATE_CCW).toBe('KeyZ');
    expect(DEFAULT_KEYBINDINGS.ROTATE_CW).toBe('KeyX');
  });

  it('binds hold to a key that does not collide with rotation', () => {
    expect(DEFAULT_KEYBINDINGS.HOLD).toBe('KeyC');
  });

  it('defaults undo/redo to Ctrl+Z and Ctrl+Y', () => {
    expect(DEFAULT_KEYBINDINGS.UNDO).toBe('Ctrl+KeyZ');
    expect(DEFAULT_KEYBINDINGS.REDO).toBe('Ctrl+KeyY');
  });
});

describe('binding codes with modifiers', () => {
  it('parses a plain key code', () => {
    expect(parseBinding('KeyZ')).toEqual({ code: 'KeyZ', ctrl: false, shift: false, alt: false });
  });

  it('parses a ctrl-modified code', () => {
    expect(parseBinding('Ctrl+KeyZ')).toEqual({ code: 'KeyZ', ctrl: true, shift: false, alt: false });
  });

  it('parses multiple modifiers in canonical order', () => {
    expect(parseBinding('Ctrl+Shift+KeyZ')).toEqual({
      code: 'KeyZ', ctrl: true, shift: true, alt: false,
    });
  });

  it('serialises an event into a canonical binding code', () => {
    expect(eventToBindingCode({ code: 'KeyZ', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }))
      .toBe('Ctrl+KeyZ');
    expect(eventToBindingCode({ code: 'KeyZ', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }))
      .toBe('KeyZ');
  });

  it('treats Meta (Cmd) as Ctrl so macOS Cmd+Z works', () => {
    expect(eventToBindingCode({ code: 'KeyZ', ctrlKey: false, shiftKey: false, altKey: false, metaKey: true }))
      .toBe('Ctrl+KeyZ');
  });

  it('maps bare modifier presses to their own binding token', () => {
    expect(eventToBindingCode({ code: 'ShiftLeft', ctrlKey: false, shiftKey: true, altKey: false, metaKey: false }))
      .toBe('Shift');
    expect(eventToBindingCode({ code: 'ShiftRight', ctrlKey: false, shiftKey: true, altKey: false, metaKey: false }))
      .toBe('Shift');
    expect(eventToBindingCode({ code: 'ControlLeft', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }))
      .toBe('Ctrl');
    expect(eventToBindingCode({ code: 'ControlRight', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }))
      .toBe('Ctrl');
    expect(eventToBindingCode({ code: 'AltLeft', ctrlKey: false, shiftKey: false, altKey: true, metaKey: false }))
      .toBe('Alt');
    expect(eventToBindingCode({ code: 'AltRight', ctrlKey: false, shiftKey: false, altKey: true, metaKey: false }))
      .toBe('Alt');
  });

  it('treats Meta (Cmd) as Ctrl for bare modifier presses too', () => {
    expect(eventToBindingCode({ code: 'MetaLeft', ctrlKey: false, shiftKey: false, altKey: false, metaKey: true }))
      .toBe('Ctrl');
  });

  it('parses and formats a bare modifier binding', () => {
    expect(parseBinding('Shift')).toEqual({ code: 'Shift', ctrl: false, shift: false, alt: false });
    expect(parseBinding('Ctrl')).toEqual({ code: 'Ctrl', ctrl: false, shift: false, alt: false });
    expect(parseBinding('Alt')).toEqual({ code: 'Alt', ctrl: false, shift: false, alt: false });
    expect(formatBinding('Shift')).toBe('Shift');
    expect(formatBinding('Ctrl')).toBe('Ctrl');
    expect(formatBinding('Alt')).toBe('Alt');
  });

  it('formats a binding for display', () => {
    expect(formatBinding('Ctrl+KeyZ')).toBe('Ctrl + Z');
    expect(formatBinding('KeyX')).toBe('X');
    expect(formatBinding('ArrowLeft')).toBe('Left');
  });
});

describe('KeybindingsStore modifier resolution', () => {
  beforeEach(() => localStorage.clear());

  it('resolves Ctrl+Z to UNDO and bare Z to ROTATE_CCW', () => {
    const store = new KeybindingsStore();
    expect(store.resolveAction({ code: 'KeyZ', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }))
      .toBe('UNDO');
    expect(store.resolveAction({ code: 'KeyZ', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }))
      .toBe('ROTATE_CCW');
  });

  it('resolves Ctrl+Y to REDO', () => {
    const store = new KeybindingsStore();
    expect(store.resolveAction({ code: 'KeyY', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }))
      .toBe('REDO');
  });

  it('does not resolve a bare key when the binding requires a modifier', () => {
    const store = new KeybindingsStore();
    expect(store.resolveAction({ code: 'KeyY', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }))
      .toBeNull();
  });

  it('allows binding a combination key', () => {
    const store = new KeybindingsStore();
    store.setBinding('HARD_DROP', 'Ctrl+Space');
    expect(store.getBinding('HARD_DROP')).toBe('Ctrl+Space');
    expect(store.resolveAction({ code: 'Space', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }))
      .toBe('HARD_DROP');
  });

  it('resolves a bare modifier binding on press and release', () => {
    const store = new KeybindingsStore();
    store.setBinding('MOVE_LEFT', 'Shift');
    expect(store.resolveAction({ code: 'ShiftLeft', ctrlKey: false, shiftKey: true, altKey: false, metaKey: false }))
      .toBe('MOVE_LEFT');
    expect(store.resolveAction({ code: 'ShiftRight', ctrlKey: false, shiftKey: true, altKey: false, metaKey: false }))
      .toBe('MOVE_LEFT');
  });

  it('keeps full-combination bindings distinct from a bare modifier binding', () => {
    const store = new KeybindingsStore();
    store.setBinding('MOVE_LEFT', 'Ctrl');
    expect(store.resolveAction({ code: 'ControlLeft', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }))
      .toBe('MOVE_LEFT');
    expect(store.resolveAction({ code: 'KeyZ', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }))
      .toBe('UNDO');
  });

  it('rejects a duplicate bare modifier binding', () => {
    const store = new KeybindingsStore();
    store.setBinding('MOVE_LEFT', 'Shift');
    expect(() => store.setBinding('MOVE_RIGHT', 'Shift')).toThrow();
  });
});
