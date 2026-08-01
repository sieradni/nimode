import { InputAction } from './types';
import { InputEvent } from './interfaces/IEngineCore';
import { keybindingsStore } from './keybindingsStore';

const HELD_ACTIONS: InputAction[] = ['MOVE_LEFT', 'MOVE_RIGHT', 'SOFT_DROP'];

export function isHeldAction(action: InputAction): boolean {
  return HELD_ACTIONS.includes(action);
}

export function actionToInputEvent(action: InputAction, pressed: boolean): InputEvent | null {
  switch (action) {
    case 'MOVE_LEFT':
      return { type: 'MOVE_LEFT', pressed };
    case 'MOVE_RIGHT':
      return { type: 'MOVE_RIGHT', pressed };
    case 'SOFT_DROP':
      return { type: 'SOFT_DROP', pressed };
    case 'HARD_DROP':
      return pressed ? { type: 'HARD_DROP' } : null;
    case 'ROTATE_CW':
      return pressed ? { type: 'ROTATE_CW' } : null;
    case 'ROTATE_CCW':
      return pressed ? { type: 'ROTATE_CCW' } : null;
    case 'ROTATE_180':
      return pressed ? { type: 'ROTATE_180' } : null;
    case 'HOLD':
      return pressed ? { type: 'HOLD' } : null;
    case 'CLEAR_HOLD':
      return pressed ? { type: 'CLEAR_HOLD' } : null;
    case 'RESET':
      return pressed ? { type: 'RESET' } : null;
    default:
      return null;
  }
}

export type ResolveAction = (event: { code: string }) => InputAction | null;

export interface KeyboardInputAdapterOptions {
  onInput: (event: InputEvent) => void;
  resolveAction?: ResolveAction;
  isEnabled?: () => boolean;
}

export class KeyboardInputAdapter {
  private readonly onInput: (event: InputEvent) => void;
  private readonly resolveAction: ResolveAction;
  private readonly isEnabled: () => boolean;
  private readonly handleKeyDown: (event: KeyboardEvent) => void;
  private readonly handleKeyUp: (event: KeyboardEvent) => void;

  constructor(options: KeyboardInputAdapterOptions) {
    this.onInput = options.onInput;
    this.resolveAction = options.resolveAction ?? ((event) => keybindingsStore.resolveAction(event));
    this.isEnabled = options.isEnabled ?? (() => true);
    this.handleKeyDown = (event) => this.onKeyEvent(event, true);
    this.handleKeyUp = (event) => this.onKeyEvent(event, false);
  }

  attach(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  detach(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private onKeyEvent(event: KeyboardEvent, pressed: boolean): void {
    if (!this.isEnabled()) return;
    const action = this.resolveAction(event);
    if (action === null) return;
    if (event.repeat && !isHeldAction(action)) return;
    const inputEvent = actionToInputEvent(action, pressed);
    if (inputEvent !== null) {
      this.onInput(inputEvent);
    }
  }
}
