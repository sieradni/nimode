import { InputAction, KeyBindings, DEFAULT_KEYBINDINGS } from './types';

const STORAGE_KEY = 'nimode_keybindings';

function loadFromStorage(): KeyBindings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return { ...DEFAULT_KEYBINDINGS };
    }
    const parsed: Record<string, unknown> = JSON.parse(raw);
    const actions: InputAction[] = [
      'MOVE_LEFT', 'MOVE_RIGHT', 'SOFT_DROP', 'HARD_DROP',
      'ROTATE_CW', 'ROTATE_CCW', 'ROTATE_180', 'HOLD', 'CLEAR_HOLD', 'RESET',
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

  resolveAction(event: { code: string }): InputAction | null {
    const entries = Object.entries(this.bindings) as [InputAction, string][];
    for (const [action, code] of entries) {
      if (code === event.code) {
        return action;
      }
    }
    return null;
  }
}

export const keybindingsStore = new KeybindingsStore();
