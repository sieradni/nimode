/**
 * Binding codes are canonical strings describing a key plus its modifiers,
 * e.g. `KeyZ`, `Ctrl+KeyZ`, `Ctrl+Shift+KeyZ`. Modifiers are always emitted in
 * the order Ctrl, Shift, Alt so a binding has exactly one representation.
 */

export interface ParsedBinding {
  code: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
}

export interface BindableKeyEvent {
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

/** Maps a modifier key code to its canonical binding token. */
export function modifierTokenForCode(code: string): string | null {
  switch (code) {
    case 'ShiftLeft':
    case 'ShiftRight':
      return 'Shift';
    case 'ControlLeft':
    case 'ControlRight':
    case 'MetaLeft':
    case 'MetaRight':
      return 'Ctrl';
    case 'AltLeft':
    case 'AltRight':
      return 'Alt';
    default:
      return null;
  }
}

/** Canonical tokens a bare modifier key binds to. */
const BARE_MODIFIER_TOKENS = new Set(['Ctrl', 'Shift', 'Alt']);

export function parseBinding(binding: string): ParsedBinding {
  const parts = binding.split('+');
  const only = parts[0];
  if (parts.length === 1 && only !== undefined && BARE_MODIFIER_TOKENS.has(only)) {
    return { code: only, ctrl: false, shift: false, alt: false };
  }
  const code = parts[parts.length - 1] ?? '';
  return {
    code,
    ctrl: parts.includes('Ctrl'),
    shift: parts.includes('Shift'),
    alt: parts.includes('Alt'),
  };
}

export function toBindingCode(parsed: ParsedBinding): string {
  const parts: string[] = [];
  if (parsed.ctrl) parts.push('Ctrl');
  if (parsed.shift) parts.push('Shift');
  if (parsed.alt) parts.push('Alt');
  parts.push(parsed.code);
  return parts.join('+');
}

/**
 * Serialises a keyboard event into a canonical binding code, or `null` when the
 * event carries no bindable key. Bare modifier presses become their own token
 * (`Shift`, `Ctrl`, `Alt`) so a modifier can be bound on its own. Meta (Cmd) is
 * folded into Ctrl so the same binding works on macOS and Windows.
 */
export function eventToBindingCode(event: BindableKeyEvent): string | null {
  if (event.code === '') return null;
  const bareModifier = modifierTokenForCode(event.code);
  if (bareModifier !== null) return bareModifier;
  return toBindingCode({
    code: event.code,
    ctrl: event.ctrlKey || event.metaKey,
    shift: event.shiftKey,
    alt: event.altKey,
  });
}

function formatKeyName(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Arrow')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
  return code;
}

/** Human-readable label for the settings UI, e.g. `Ctrl+KeyZ` -> `Ctrl + Z`. */
export function formatBinding(binding: string): string {
  const parsed = parseBinding(binding);
  const parts: string[] = [];
  if (parsed.ctrl) parts.push('Ctrl');
  if (parsed.shift) parts.push('Shift');
  if (parsed.alt) parts.push('Alt');
  parts.push(formatKeyName(parsed.code));
  return parts.join(' + ');
}
