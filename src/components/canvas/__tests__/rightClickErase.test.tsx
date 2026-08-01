import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameBoardCanvas } from '../GameBoardCanvas';
import { EngineCore } from '../../../engine/EngineCore';
import { sevenBagRandomizer } from '../../../engine/systems/SevenBagRandomizer';
import { srsPlusRotationSystem } from '../../../engine/systems/SrsPlusRotationSystem';

function makeState() {
  const engine = new EngineCore({
    rotationSystem: srsPlusRotationSystem,
    bagRandomizer: sevenBagRandomizer,
  });
  return engine.getState();
}

describe('right-click eraser', () => {
  it('erases instead of drawing when the right button is pressed', () => {
    const onPen = vi.fn();
    const onErase = vi.fn();

    render(
      <GameBoardCanvas
        state={makeState()}
        annotationTool="pen"
        onAnnotationPen={onPen}
        onAnnotationErase={onErase}
      />,
    );

    const canvas = screen.getByTestId('board-canvas');
    fireEvent.mouseDown(canvas, { button: 2, clientX: 15, clientY: 15 });

    expect(onErase).toHaveBeenCalled();
    expect(onPen).not.toHaveBeenCalled();
  });

  it('still draws with the left button while the pen tool is active', () => {
    const onPen = vi.fn();
    const onErase = vi.fn();

    render(
      <GameBoardCanvas
        state={makeState()}
        annotationTool="pen"
        onAnnotationPen={onPen}
        onAnnotationErase={onErase}
      />,
    );

    const canvas = screen.getByTestId('board-canvas');
    fireEvent.mouseDown(canvas, { button: 0, clientX: 15, clientY: 15 });

    expect(onPen).toHaveBeenCalled();
    expect(onErase).not.toHaveBeenCalled();
  });

  it('keeps erasing while the right button is dragged', () => {
    const onErase = vi.fn();

    const { rerender } = render(
      <GameBoardCanvas
        state={makeState()}
        annotationTool="pen"
        onAnnotationErase={onErase}
        onAnnotationPen={vi.fn()}
        isDrawing={false}
      />,
    );

    const canvas = screen.getByTestId('board-canvas');
    fireEvent.mouseDown(canvas, { button: 2, clientX: 15, clientY: 15 });

    rerender(
      <GameBoardCanvas
        state={makeState()}
        annotationTool="pen"
        onAnnotationErase={onErase}
        onAnnotationPen={vi.fn()}
        isDrawing={true}
      />,
    );

    onErase.mockClear();
    fireEvent.mouseMove(canvas, { clientX: 45, clientY: 15 });
    expect(onErase).toHaveBeenCalled();
  });

  it('suppresses the browser context menu on the board', () => {
    render(<GameBoardCanvas state={makeState()} annotationTool="pen" onAnnotationPen={vi.fn()} />);
    const canvas = screen.getByTestId('board-canvas');

    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    canvas.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
