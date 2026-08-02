import { describe, it, expect } from 'vitest';
import {
  PALETTE_CELL_OFFSET,
  MAX_USER_PALETTE_SIZE,
  DEFAULT_ANNOTATION_COLOR,
  registerPaletteColor,
  paletteColorFor,
} from '../annotationPalette';

describe('registerPaletteColor', () => {
  it('reuses the index of an already registered colour', () => {
    const palette = ['#ffffff', '#f87171'];
    const result = registerPaletteColor(palette, '#f87171');
    expect(result.index).toBe(1);
    expect(result.userPalette).toEqual(palette);
  });

  it('appends a new colour and returns its fresh index', () => {
    const palette = ['#ffffff'];
    const result = registerPaletteColor(palette, '#f87171');
    expect(result.index).toBe(1);
    expect(result.userPalette).toEqual(['#ffffff', '#f87171']);
  });

  it('is pure: does not mutate the input palette', () => {
    const palette = ['#ffffff'];
    registerPaletteColor(palette, '#f87171');
    expect(palette).toEqual(['#ffffff']);
  });

  it('falls back to index 0 when the palette is full', () => {
    const palette = Array.from({ length: MAX_USER_PALETTE_SIZE }, (_, i) => `#${i.toString(16).padStart(6, '0')}`);
    const result = registerPaletteColor(palette, '#abcdef');
    expect(result.index).toBe(0);
    expect(result.userPalette).toEqual(palette);
  });
});

describe('paletteColorFor', () => {
  it('returns null for tetromino cells', () => {
    expect(paletteColorFor(0, ['#ffffff'])).toBeNull();
    expect(paletteColorFor(7, ['#ffffff'])).toBeNull();
  });

  it('returns the palette colour for a palette cell', () => {
    const palette = ['#ffffff', '#f87171'];
    expect(paletteColorFor(PALETTE_CELL_OFFSET, palette)).toBe('#ffffff');
    expect(paletteColorFor(PALETTE_CELL_OFFSET + 1, palette)).toBe('#f87171');
  });

  it('returns null when the palette has no entry for the cell', () => {
    expect(paletteColorFor(PALETTE_CELL_OFFSET + 3, ['#ffffff'])).toBeNull();
  });

  it('defaults user marks to white', () => {
    expect(DEFAULT_ANNOTATION_COLOR).toBe('#ffffff');
    expect(PALETTE_CELL_OFFSET).toBe(8);
  });
});
