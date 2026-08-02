import { GameState } from './types';
import { InputEvent } from './interfaces/IEngineCore';
import { isAnnotationEvent, isBoardEditEvent, reduceAnnotationEvent, reduceBoardEditEvent } from './annotationInput';
import { EditSession } from './editSession';
import { autoColorStroke } from './autoColorEngine';

export function isEditInput(input: InputEvent): boolean {
  return (
    input.type === 'EDIT_BEGIN' ||
    input.type === 'EDIT_COMMIT' ||
    input.type.startsWith('ANNOTATE') ||
    input.type.startsWith('BOARD')
  );
}

export interface EditInputDeps {
  isAutoColorEnabled(): boolean;
  saveSnapshot(): void;
}

/**
 * Applies annotation and block-mode edits plus their undo transaction framing.
 * Grouped here (instead of inside EngineCore) to keep the core engine file
 * within the line budget.
 */
export function handleEditInput(
  state: GameState,
  session: EditSession,
  deps: EditInputDeps,
  input: InputEvent,
): void {
  if (input.type === 'EDIT_BEGIN') {
    session.begin(input.mode);
    return;
  }
  if (input.type === 'EDIT_COMMIT') {
    session.commit({
      cells: input.cells,
      autoColorEnabled: deps.isAutoColorEnabled(),
      applyStrokeAutoColor: (cells) => {
        state.annotations = autoColorStroke(state.annotations, cells);
      },
      saveSnapshot: deps.saveSnapshot,
    });
    return;
  }
  if (isAnnotationEvent(input)) {
    const reduction = reduceAnnotationEvent(state.annotations, state.userPalette, input);
    state.annotations = reduction.layer;
    state.userPalette = reduction.userPalette;
    session.markDirty();
    if (input.type === 'ANNOTATE_CLEAR_ALL' && !session.isActive()) {
      deps.saveSnapshot();
    }
    return;
  }
  if (isBoardEditEvent(input)) {
    const reduction = reduceBoardEditEvent(state.board, state.userPalette, input);
    state.board = reduction.layer;
    state.userPalette = reduction.userPalette;
    session.markDirty();
  }
}
