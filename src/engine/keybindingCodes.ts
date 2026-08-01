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

/** Bare modifier presses can never be a binding on their own. */
const MODIFIER_CODES = new Set([
  'ControlLeft', 'ControlRight',
  'ShiftLeft', 'ShiftRight',
  'AltLeft', 'AltRight',
  'MetaLeft', 'MetaRight',
]);

export function parseBinding(binding: string): ParsedBinding {
  const parts = binding.split('+');
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
 * event carries no bindable key. Meta (Cmd) is folded into Ctrl so the same
 * binding works on macOS and Windows.
 */
export function eventToBindingCode(event: BindableKeyEvent): string | null {
  if (MODIFIER_CODES.has(event.code)) return null;
  if (event.code === '') return null;
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
