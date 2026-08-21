import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import IconButton from './IconButton';
import { useFocusTrap } from './useFocusTrap';

// Rendered whether it is open or not, and moved off screen when it is not, so
// it animates on the way out as well as the way in
function Drawer({ open, onClose, label, header, children }) {
  const panel = useFocusTrap(open, onClose);

  return createPortal(
    <>
      <div
        className={`duration-(--motion-panel) fixed inset-0 z-20 bg-black/50 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`duration-(--motion-panel) fixed top-0 right-0 z-20 flex h-full w-full max-w-sm flex-col border-l border-line bg-surface transition-transform elev-3 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label={label}
        aria-hidden={open ? undefined : 'true'}
        // Shut, it is still in the page, and inert is what keeps Tab from
        // walking into it
        inert={!open}
        ref={panel}
      >
        <header className="glass sticky top-0 flex items-center gap-3 border-b border-line px-5 py-4">
          <div className="mr-auto min-w-0">{header}</div>

          <IconButton label={`Close ${label.toLowerCase()}`} onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </>,
    document.body,
  );
}

export default Drawer;
