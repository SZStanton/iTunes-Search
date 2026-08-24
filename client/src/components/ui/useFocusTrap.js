import { useEffect, useRef } from 'react';
import { useRegisterOverlay } from '../../context/useOverlay';

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Shared, so the drawer and the modal cannot drift on Escape or focus.
function useFocusTrap(open, onClose) {
  const panel = useRef(null);
  const returnTo = useRef(null);

  useRegisterOverlay(open);

  useEffect(() => {
    if (!open) return;

    returnTo.current = document.activeElement;
    panel.current?.querySelector(FOCUSABLE)?.focus();

    const onKeyDown = event => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      // Without this, tabbing walks out into the page behind.
      const stops = panel.current?.querySelectorAll(FOCUSABLE);
      if (!stops?.length) return;

      const first = stops[0];
      const last = stops[stops.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      // Back to whatever opened it, rather than the top of the page.
      returnTo.current?.focus?.();
    };
  }, [open, onClose]);

  return panel;
}

export { useFocusTrap };
