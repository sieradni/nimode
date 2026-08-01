import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnnotationToolbar } from './AnnotationToolbar';

describe('AnnotationToolbar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render nothing when isOpen is false', () => {
    const { container } = render(
      <AnnotationToolbar isOpen={false} onClose={() => {}} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should render toolbar when open', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /pen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eraser/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rect fill/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /auto-color/i })).toBeInTheDocument();
  });

  it('should show close button', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<AnnotationToolbar isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have pen tool selected by default', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} />);
    const penButton = screen.getByRole('button', { name: /pen/i });
    expect(penButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should switch to eraser tool when clicked', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /eraser/i }));
    expect(screen.getByRole('button', { name: /eraser/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /pen/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('should switch to rect fill tool when clicked', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /rect fill/i }));
    expect(screen.getByRole('button', { name: /rect fill/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('should call onToolChange when tool changes', () => {
    const onToolChange = vi.fn();
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} onToolChange={onToolChange} />);
    fireEvent.click(screen.getByRole('button', { name: /eraser/i }));
    expect(onToolChange).toHaveBeenCalledWith('erase');
  });

  it('should call onClearAll when clear all clicked', () => {
    const onClearAll = vi.fn();
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} onClearAll={onClearAll} />);
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it('should call onAutoColorToggle when auto-color checkbox changes', () => {
    const onAutoColorToggle = vi.fn();
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} onAutoColorToggle={onAutoColorToggle} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /auto-color/i }));
    expect(onAutoColorToggle).toHaveBeenCalledWith(true);
  });

  it('should render the colour picker for the pen tool', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} />);
    expect(screen.getByLabelText(/annotation colour/i)).toBeInTheDocument();
  });

  it('should default the annotation colour to white', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} />);
    expect(screen.getByLabelText(/annotation colour/i)).toHaveValue('#ffffff');
  });

  it('should call onColorChange when the colour changes', () => {
    const onColorChange = vi.fn();
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} onColorChange={onColorChange} />);
    fireEvent.change(screen.getByLabelText(/annotation colour/i), { target: { value: '#ff0000' } });
    expect(onColorChange).toHaveBeenCalledWith('#ff0000');
  });

  it('should offer quick colour swatches', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /^white$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^red$/i })).toBeInTheDocument();
  });

  it('should select a colour from a swatch', () => {
    const onColorChange = vi.fn();
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} onColorChange={onColorChange} />);
    fireEvent.click(screen.getByRole('button', { name: /^red$/i }));
    expect(onColorChange).toHaveBeenCalledWith('#f87171');
  });

  it('should hide the colour picker when eraser is selected', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /eraser/i }));
    expect(screen.queryByLabelText(/annotation colour/i)).not.toBeInTheDocument();
  });

  it('should reflect initial tool prop', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} tool="erase" />);
    expect(screen.getByRole('button', { name: /eraser/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('should reflect initial autoColor prop', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} autoColor={true} />);
    expect(screen.getByRole('checkbox', { name: /auto-color/i })).toBeChecked();
  });

  it('should reflect the initial colour prop', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} color="#00ff00" />);
    expect(screen.getByLabelText(/annotation colour/i)).toHaveValue('#00ff00');
  });
});