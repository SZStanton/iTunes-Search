import { useEffect, useRef } from 'react';
import { swipeDirection } from '../../swipe';

// Touch only, on purpose. A mouse dragged across a page of artwork is someone
// selecting, and a trackpad has its own gesture already
function useSwipe(ref, { onLeft, onRight, enabled = true }) {
  // Read at the end of the gesture rather than closed over, so the listeners
  // are bound once instead of on every render the page number changes
  const handlers = useRef({ onLeft, onRight });

  // No dependency list, so it keeps up with a caller that rebuilds these
  useEffect(() => {
    handlers.current = { onLeft, onRight };
  });

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    let start = null;

    const down = event => {
      if (event.pointerType !== 'touch') return;
      start = { x: event.clientX, y: event.clientY };
    };

    const up = event => {
      if (!start) return;

      const direction = swipeDirection(
        event.clientX - start.x,
        event.clientY - start.y,
      );
      start = null;

      if (direction === 'left') handlers.current.onLeft?.();
      if (direction === 'right') handlers.current.onRight?.();
    };

    // The browser takes the gesture over once it decides the page is scrolling,
    // and no pointerup follows it
    const cancel = () => {
      start = null;
    };

    node.addEventListener('pointerdown', down);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', cancel);

    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', cancel);
    };
  }, [ref, enabled]);
}

export { useSwipe };
