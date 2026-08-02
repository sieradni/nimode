import { AnnotationToolbarControls } from './AnnotationToolbarControls';
import { DEFAULT_ANNOTATION_COLOR } from '../render/annotationColors';
import type { AnnotationTool, EditMode } from '../engine/types';

export type { AnnotationTool, EditMode } from '../engine/types';

export interface AnnotationToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  tool?: AnnotationTool;
  onToolChange?: (tool: AnnotationTool) => void;
  onClearAll?: () => void;
  onResetBoard?: () => void;
  mode?: EditMode;
  onModeChange?: (mode: EditMode) => void;
  autoColor?: boolean;
  onAutoColorToggle?: (enabled: boolean) => void;
  color?: string;
  onColorChange?: (color: string) => void;
}

const TOOL_LABELS: Record<AnnotationTool, string> = {
  pen: 'Pen',
  erase: 'Eraser',
  floodErase: 'Flood Erase',
  rect: 'Rect Fill',
};

/**
 * Fully controlled: the App owns the tool, mode, colour and auto-color state,
 * so toggles can never drift from the source of truth (e.g. a config-store
 * change or a reload).
 */
export function AnnotationToolbar({
  isOpen,
  onClose,
  tool = 'pen',
  onToolChange,
  onClearAll,
  onResetBoard,
  mode = 'annotations',
  onModeChange,
  autoColor = false,
  onAutoColorToggle,
  color = DEFAULT_ANNOTATION_COLOR,
  onColorChange,
}: AnnotationToolbarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2">
      <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 flex flex-col items-center gap-2">
        <div className="flex flex-col items-center gap-1 bg-slate-800 rounded p-1">
          {(['pen', 'erase', 'floodErase', 'rect'] as AnnotationTool[]).map((t) => (
            <button
              key={t}
              type="button"
              role="button"
              aria-pressed={tool === t}
              onClick={() => onToolChange?.(t)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                tool === t
                  ? 'bg-slate-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {TOOL_LABELS[t]}
            </button>
          ))}
        </div>

        <AnnotationToolbarControls
          tool={tool}
          mode={mode}
          autoColor={autoColor}
          color={color}
          onModeChange={onModeChange ?? (() => {})}
          onAutoColorToggle={onAutoColorToggle ?? (() => {})}
          onColorChange={onColorChange ?? (() => {})}
        />

        <div className="h-px w-20 bg-slate-700 my-1" />

        <button
          type="button"
          onClick={onClearAll}
          className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
        >
          Clear All
        </button>

        {onResetBoard && (
          <button
            type="button"
            onClick={onResetBoard}
            className="px-3 py-1.5 text-xs rounded bg-red-900/60 hover:bg-red-800/60 text-red-200 transition-colors"
          >
            Reset Board
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close annotation toolbar"
        className="p-2 rounded-full bg-slate-900/95 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-400 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
