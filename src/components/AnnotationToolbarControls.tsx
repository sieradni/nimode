import type { AnnotationTool, EditMode } from '../engine/types';
import { AnnotationColorPicker } from './AnnotationColorPicker';

interface AnnotationToolbarControlsProps {
  tool: AnnotationTool;
  mode: EditMode;
  autoColor: boolean;
  color: string;
  onModeChange: (mode: EditMode) => void;
  onAutoColorToggle: (enabled: boolean) => void;
  onColorChange: (color: string) => void;
}

const MODE_LABELS: Record<EditMode, string> = {
  annotations: 'Annotate',
  blocks: 'Blocks',
};

export function AnnotationToolbarControls({
  tool,
  mode,
  autoColor,
  color,
  onModeChange,
  onAutoColorToggle,
  onColorChange,
}: AnnotationToolbarControlsProps) {
  return (
    <>
      <div className="flex w-full gap-1">
        {(['annotations', 'blocks'] as EditMode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="button"
            aria-pressed={mode === m}
            onClick={() => onModeChange(m)}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              mode === m ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="h-px w-20 bg-slate-700" />

      {(tool === 'pen' || tool === 'rect') && (
        <AnnotationColorPicker color={color} onColorChange={onColorChange} />
      )}

      <div className="h-px w-20 bg-slate-700" />

      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          role="checkbox"
          aria-label="Auto-color"
          checked={autoColor}
          onChange={(e) => onAutoColorToggle(e.target.checked)}
          className="w-4 h-4 accent-slate-500 rounded border-slate-600 bg-slate-800"
        />
        <span className="text-xs text-slate-300">Auto-color</span>
      </label>
    </>
  );
}
