import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRegisterOverlay } from '../../context/useOverlay';

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function Modal({ open, onClose, label, children }) {
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

      // Without this, tabbing walks out of the modal and into the page behind
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
      // Back to whatever opened it, so the keyboard does not start again at
      // the top of the page
      returnTo.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  // Into the body, because backdrop-filter makes an element the containing
  // block for fixed children and the header this can open from has one
  return createPortal(
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className="duration-(--motion-overlay) absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative" ref={panel}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
