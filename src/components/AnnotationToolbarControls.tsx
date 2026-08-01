import type { AnnotationTool } from './canvas/canvasConstants';
import { AnnotationColorPicker } from './AnnotationColorPicker';

interface AnnotationToolbarControlsProps {
  tool: AnnotationTool;
  autoColor: boolean;
  color: string;
  onAutoColorToggle: (enabled: boolean) => void;
  onColorChange: (color: string) => void;
}

export function AnnotationToolbarControls({
  tool,
  autoColor,
  color,
  onAutoColorToggle,
  onColorChange,
}: AnnotationToolbarControlsProps) {
  return (
    <>
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
