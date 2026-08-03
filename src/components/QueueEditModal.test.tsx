import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueueEditModal } from './QueueEditModal';
import { parsePieceInput } from '../engine/pieceInput';

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
  it('prefills the input with the current queue letters', () => {
    render(<QueueEditModal currentPieces={[1, 6, 4]} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('ITO');
  });

  it('confirms parsed pieces when OK is clicked', () => {
    const onConfirm = vi.fn();
    render(<QueueEditModal currentPieces={[]} onConfirm={onConfirm} onClose={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'tzs' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onConfirm).toHaveBeenCalledWith([6, 7, 5]);
  });

  it('confirms parsed pieces on Enter', () => {
    const onConfirm = vi.fn();
    render(<QueueEditModal currentPieces={[]} onConfirm={onConfirm} onClose={vi.fn()} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'i o' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onConfirm).toHaveBeenCalledWith([1, 4]);
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<QueueEditModal currentPieces={[]} onConfirm={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('disables OK when no valid pieces are entered', () => {
    render(<QueueEditModal currentPieces={[]} onConfirm={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '###' } });
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();
  });

  it('auto-capitalizes typed input', () => {
    render(<QueueEditModal currentPieces={[]} onConfirm={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'tio' } });
    expect(screen.getByRole('textbox')).toHaveValue('TIO');
  });
});