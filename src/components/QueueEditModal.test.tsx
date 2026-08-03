import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { QueueEditModal } from './QueueEditModal';
import { parsePieceInput } from '../engine/pieceInput';
import { PieceType } from '../engine/types';

describe('parsePieceInput', () => {
  it('maps tetromino letters (case-insensitive) to piece types', () => {
    expect(parsePieceInput('ijlostz')).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(parsePieceInput('IlOsTz')).toEqual([1, 3, 4, 5, 6, 7]);
  });

  it('skips non-tetromino characters and whitespace', () => {
    expect(parsePieceInput('T I,O S Z')).toEqual([6, 1, 4, 5, 7]);
    expect(parsePieceInput('abc')).toEqual([]);
    expect(parsePieceInput('')).toEqual([]);
  });
});

describe('QueueEditModal', () => {
  const baseProps = {
    activePiece: 6 as PieceType,
    queue: [1, 2, 3, 4, 5, 6, 7, 1] as PieceType[],
    bagRemaining: 3,
  };

  it('prefills the input with the first 7 upcoming queue pieces', () => {
    render(<QueueEditModal {...baseProps} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('IJLOSTZ');
  });

  it('confirms parsed pieces on Enter, keeping the unchanged queue tail', () => {
    const onConfirm = vi.fn();
    render(<QueueEditModal {...baseProps} onConfirm={onConfirm} onClose={vi.fn()} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'TZS' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onConfirm).toHaveBeenCalledWith([6, 7, 5, 4, 5, 6, 7, 1]);
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<QueueEditModal {...baseProps} onConfirm={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('disables OK when no valid pieces are entered', () => {
    const onConfirm = vi.fn();
    render(<QueueEditModal {...baseProps} onConfirm={onConfirm} onClose={vi.fn()} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '###' } });
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('auto-capitalizes typed input', () => {
    render(<QueueEditModal {...baseProps} onConfirm={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'tio' } });
    expect(screen.getByRole('textbox')).toHaveValue('TIO');
  });

  it('shows the falling piece as the first preview slot followed by the result queue', () => {
    const onConfirm = vi.fn();
    render(<QueueEditModal {...baseProps} onConfirm={onConfirm} onClose={vi.fn()} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'IO' } });

    const legend = screen.getByText(/result preview/i);
    const fieldset = legend.closest('fieldset');
    expect(fieldset).not.toBeNull();

    const slots = within(fieldset as HTMLElement).getAllByTestId('preview-slot');
    expect(slots.length).toBe(8);
  });

  it('draws a boundary separator ahead of the slot where the next bag begins', () => {
    const onConfirm = vi.fn();
    const { container } = render(
      <QueueEditModal
        {...baseProps}
        bagRemaining={2}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />
    );
    const fieldset = container.querySelector('fieldset');
    expect(fieldset).not.toBeNull();
    const separators = fieldset!.querySelectorAll('[data-testid="bag-boundary"]');
    // bagRemaining=2 over an 8-slot composite (with the falling piece offset +1)
    // puts boundaries after slots 3 and 10 -> only the first is visible.
    expect(separators.length).toBe(1);
  });

  it('shows an empty placeholder slot when there is no active piece', () => {
    render(
      <QueueEditModal
        activePiece={null}
        queue={[1, 2, 3]}
        bagRemaining={5}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const legend = screen.getByText(/result preview/i);
    const fieldset = legend.closest('fieldset');
    expect(fieldset?.querySelectorAll('.bg-slate-800\\/60').length).toBe(1);
  });
});