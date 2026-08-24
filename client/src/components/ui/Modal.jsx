import { createPortal } from 'react-dom';
import { useFocusTrap } from './useFocusTrap';

function Modal({ open, onClose, label, children }) {
  const panel = useFocusTrap(open, onClose);

  if (!open) return null;

  // Portal to the body. backdrop-filter on the header would otherwise become
  // the containing block for this fixed child.
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
