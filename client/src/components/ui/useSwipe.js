import { useEffect, useRef } from 'react';
import { swipeDirection } from '../../swipe';

// Touch only. A mouse dragged across artwork is someone selecting.
function useSwipe(ref, { onLeft, onRight, enabled = true }) {
  // Read at the end of the gesture, so the listeners bind once.
  const handlers = useRef({ onLeft, onRight });

  // No dependency list, so it keeps up with a caller that rebuilds these.
  useEffect(() => {
    handlers.current = { onLeft, onRight };
  });

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    let start = null;

    const down = event => {
      if (event.pointerType !== 'touch') return;
      // The first finger owns the gesture, or a second one moves the origin.
      if (start) return;

      start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };

    const up = event => {
      if (!start || event.pointerId !== start.id) return;

      const direction = swipeDirection(
        event.clientX - start.x,
        event.clientY - start.y,
      );
      start = null;

      if (direction === 'left') handlers.current.onLeft?.();
      if (direction === 'right') handlers.current.onRight?.();
    };

    // The browser takes over once it decides the page is scrolling, and no
    // pointerup follows.
    const cancel = event => {
      if (start && event.pointerId === start.id) start = null;
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
