import { DEFAULT_ANNOTATION_COLOR } from '../render/annotationColors';

interface AnnotationColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
}

/** A few quick picks alongside the full picker. */
const SWATCHES: ReadonlyArray<{ value: string; label: string }> = [
  { value: DEFAULT_ANNOTATION_COLOR, label: 'White' },
  { value: '#9ca3af', label: 'Grey' },
  { value: '#f87171', label: 'Red' },
  { value: '#facc15', label: 'Yellow' },
  { value: '#4ade80', label: 'Green' },
  { value: '#60a5fa', label: 'Blue' },
];

export function AnnotationColorPicker({ color, onColorChange }: AnnotationColorPickerProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <label htmlFor="annotation-color" className="text-[10px] uppercase tracking-wide text-slate-500">
        Colour
      </label>
      <input
        id="annotation-color"
        type="color"
        aria-label="Annotation colour"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        className="h-7 w-12 cursor-pointer rounded border border-slate-700 bg-slate-800 p-0.5"
      />
      <div className="grid grid-cols-3 gap-1">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch.value}
            type="button"
            aria-label={swatch.label}
            aria-pressed={color.toLowerCase() === swatch.value.toLowerCase()}
            onClick={() => onColorChange(swatch.value)}
            style={{ backgroundColor: swatch.value }}
            className={`h-5 w-5 rounded border transition-colors ${
              color.toLowerCase() === swatch.value.toLowerCase()
                ? 'border-white'
                : 'border-slate-600 hover:border-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
