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

  it('should render piece type selector for pen tool', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('combobox', { name: /piece type/i })).toBeInTheDocument();
  });

  it('should call onPieceTypeChange when piece type changes', () => {
    const onPieceTypeChange = vi.fn();
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} onPieceTypeChange={onPieceTypeChange} />);
    const select = screen.getByRole('combobox', { name: /piece type/i });
    fireEvent.change(select, { target: { value: '1' } });
    expect(onPieceTypeChange).toHaveBeenCalledWith(1);
  });

  it('should show piece names in selector (I, J, L, O, S, T, Z)', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} />);
    const select = screen.getByRole('combobox', { name: /piece type/i });
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(7);
    expect(screen.getByText('I')).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('O')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('Z')).toBeInTheDocument();
  });

  it('should hide piece type selector when eraser is selected', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /eraser/i }));
    expect(screen.queryByRole('combobox', { name: /piece type/i })).not.toBeInTheDocument();
  });

  it('should hide piece type selector when rect fill is selected', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /rect fill/i }));
    expect(screen.queryByRole('combobox', { name: /piece type/i })).not.toBeInTheDocument();
  });

  it('should reflect initial tool prop', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} tool="erase" />);
    expect(screen.getByRole('button', { name: /eraser/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('should reflect initial autoColor prop', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} autoColor={true} />);
    expect(screen.getByRole('checkbox', { name: /auto-color/i })).toBeChecked();
  });

  it('should reflect initial pieceType prop', () => {
    render(<AnnotationToolbar isOpen={true} onClose={() => {}} pieceType={3} />);
    const select = screen.getByRole('combobox', { name: /piece type/i });
    expect(select).toHaveValue('3');
  });
});