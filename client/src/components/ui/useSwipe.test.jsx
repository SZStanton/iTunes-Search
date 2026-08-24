import { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSwipe } from './useSwipe';

// user-event drops the pointerup on a two finger sequence, so the multi touch
// case cannot be driven through the app. These go straight at the element
function pointer(type, props) {
  return Object.assign(new Event(type, { bubbles: true }), {
    pointerType: 'touch',
    pointerId: 1,
    ...props,
  });
}

function Harness({ onLeft, onRight, enabled = true }) {
  const area = useRef(null);
  useSwipe(area, { onLeft, onRight, enabled });

  return <div data-testid="area" ref={area} />;
}

function setup(props = {}) {
  const onLeft = vi.fn();
  const onRight = vi.fn();
  render(<Harness onLeft={onLeft} onRight={onRight} {...props} />);

  return { onLeft, onRight, area: screen.getByTestId('area') };
}

describe('the swipe hook', () => {
  it('calls left when the finger travels left', () => {
    const { onLeft, onRight, area } = setup();

    area.dispatchEvent(pointer('pointerdown', { clientX: 260, clientY: 400 }));
    area.dispatchEvent(pointer('pointerup', { clientX: 60, clientY: 404 }));

    expect(onLeft).toHaveBeenCalledOnce();
    expect(onRight).not.toHaveBeenCalled();
  });

  it('calls right on the way back', () => {
    const { onLeft, onRight, area } = setup();

    area.dispatchEvent(pointer('pointerdown', { clientX: 60, clientY: 400 }));
    area.dispatchEvent(pointer('pointerup', { clientX: 260, clientY: 404 }));

    expect(onRight).toHaveBeenCalledOnce();
    expect(onLeft).not.toHaveBeenCalled();
  });

  it('sits out a mouse drag of the same shape', () => {
    const { onLeft, area } = setup();

    area.dispatchEvent(
      pointer('pointerdown', { pointerType: 'mouse', clientX: 260 }),
    );
    area.dispatchEvent(
      pointer('pointerup', { pointerType: 'mouse', clientX: 60 }),
    );

    expect(onLeft).not.toHaveBeenCalled();
  });

  // A second finger used to move the origin, so lifting the first measured the
  // gap between two fingers and paged on a gesture nobody made
  it('keeps the first finger and ignores a second', () => {
    const { onLeft, onRight, area } = setup();

    area.dispatchEvent(
      pointer('pointerdown', { pointerId: 1, clientX: 60, clientY: 400 }),
    );
    area.dispatchEvent(
      pointer('pointerdown', { pointerId: 2, clientX: 260, clientY: 400 }),
    );
    area.dispatchEvent(
      pointer('pointerup', { pointerId: 1, clientX: 60, clientY: 400 }),
    );

    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();
  });

  it('lets the second finger lift without paging', () => {
    const { onLeft, onRight, area } = setup();

    area.dispatchEvent(
      pointer('pointerdown', { pointerId: 1, clientX: 260, clientY: 400 }),
    );
    area.dispatchEvent(
      pointer('pointerup', { pointerId: 2, clientX: 60, clientY: 400 }),
    );

    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();
  });

  it('forgets the gesture once the browser cancels it', () => {
    const { onLeft, area } = setup();

    area.dispatchEvent(pointer('pointerdown', { clientX: 260, clientY: 400 }));
    area.dispatchEvent(pointer('pointercancel', {}));
    area.dispatchEvent(pointer('pointerup', { clientX: 60, clientY: 400 }));

    expect(onLeft).not.toHaveBeenCalled();
  });

  it('does nothing at all while disabled', () => {
    const { onLeft, area } = setup({ enabled: false });

    area.dispatchEvent(pointer('pointerdown', { clientX: 260, clientY: 400 }));
    area.dispatchEvent(pointer('pointerup', { clientX: 60, clientY: 404 }));

    expect(onLeft).not.toHaveBeenCalled();
  });
});
