import { InputAction, KeyBindings, DEFAULT_KEYBINDINGS } from './types';
import { eventToBindingCode } from './keybindingCodes';

const STORAGE_KEY = 'nimode_keybindings';

export interface ResolvableKeyEvent {
  code: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

function loadFromStorage(): KeyBindings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return { ...DEFAULT_KEYBINDINGS };
    }
    const parsed: Record<string, unknown> = JSON.parse(raw);
    const actions: InputAction[] = [
      'MOVE_LEFT', 'MOVE_RIGHT', 'SOFT_DROP', 'HARD_DROP',
      'ROTATE_CW', 'ROTATE_CCW', 'ROTATE_180', 'HOLD', 'RESET', 'UNDO', 'REDO',
    ];
    for (const action of actions) {
      if (typeof parsed[action] !== 'string') {
        return { ...DEFAULT_KEYBINDINGS };
      }
    }
    return parsed as unknown as KeyBindings;
  } catch (_err: unknown) {
    return { ...DEFAULT_KEYBINDINGS };
  }
}

function saveToStorage(bindings: KeyBindings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
}

function findDuplicateAction(
  bindings: KeyBindings,
  action: InputAction,
  keyCode: string,
): InputAction | null {
  const entries = Object.entries(bindings) as [InputAction, string][];
  for (const [a, k] of entries) {
    if (a !== action && k === keyCode) {
      return a;
    }
  }
  return null;
}

export class KeybindingsStore {
  private bindings: KeyBindings;

  constructor() {
    this.bindings = loadFromStorage();
  }

  getBindings(): KeyBindings {
    return { ...this.bindings };
  }

  getBinding(action: InputAction): string {
    return this.bindings[action];
  }

  setBinding(action: InputAction, keyCode: string): void {
    const duplicate = findDuplicateAction(this.bindings, action, keyCode);
    if (duplicate !== null) {
      throw new Error(
        `Key "${keyCode}" is already bound to ${duplicate}`,
      );
    }
    this.bindings = { ...this.bindings, [action]: keyCode };
    saveToStorage(this.bindings);
  }

  setAllBindings(bindings: KeyBindings): void {
    this.bindings = { ...bindings };
    saveToStorage(this.bindings);
  }

  resetBinding(action: InputAction): void {
    this.bindings = {
      ...this.bindings,
      [action]: DEFAULT_KEYBINDINGS[action],
    };
    saveToStorage(this.bindings);
  }

  resetAllBindings(): void {
    this.bindings = { ...DEFAULT_KEYBINDINGS };
    saveToStorage(this.bindings);
  }

  /**
   * Resolves a key event to an action. Bindings are compared on their full
   * modifier combination, so `Ctrl+Z` (undo) and a bare `Z` (rotate CCW) stay
   * distinct rather than both firing.
   */
  resolveAction(event: ResolvableKeyEvent): InputAction | null {
    const pressed = eventToBindingCode({
      code: event.code,
      ctrlKey: event.ctrlKey ?? false,
      shiftKey: event.shiftKey ?? false,
      altKey: event.altKey ?? false,
      metaKey: event.metaKey ?? false,
    });
    if (pressed === null) return null;

    const entries = Object.entries(this.bindings) as [InputAction, string][];
    for (const [action, binding] of entries) {
      if (binding === pressed) {
        return action;
      }
    }
    return null;
  }
}

export const keybindingsStore = new KeybindingsStore();
