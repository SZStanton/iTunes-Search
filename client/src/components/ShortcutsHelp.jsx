import { useEffect, useState } from 'react';
import { Keyboard } from '@phosphor-icons/react';
import { typingIn } from '../keys';
import { useOverlayOpen } from '../context/useOverlay';
import IconButton from './ui/IconButton';
import Modal from './ui/Modal';
import Surface from './ui/Surface';

const shortcuts = [
  ['/', 'Jump to the search box'],
  ['←  →', 'Previous and next page'],
  ['?', 'This list'],
  ['Esc', 'Close whatever is open'],
];

function ShortcutsHelp({ className = '' }) {
  const [open, setOpen] = useState(false);
  const overlayOpen = useOverlayOpen();

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key !== '?' || typingIn(event.target)) return;

      // Escape belongs to whatever is already open, so do not stack on it.
      if (overlayOpen) return;

      event.preventDefault();
      setOpen(true);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [overlayOpen]);

  return (
    <>
      <IconButton
        className={className}
        label="Keyboard shortcuts"
        onClick={() => setOpen(true)}
      >
        <Keyboard size={18} />
      </IconButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        label="Keyboard shortcuts"
      >
        <Surface className="w-80 max-w-[90vw] p-6">
          <h2 className="type-title mb-4 text-lg">Keyboard shortcuts</h2>

          <dl className="flex flex-col gap-3">
            {shortcuts.map(([key, what]) => (
              <div className="flex items-baseline gap-4" key={key}>
                <dt className="type-chrome w-20 shrink-0 rounded-control bg-raised px-2 py-1 text-center text-sm text-ink">
                  {key}
                </dt>
                <dd className="type-meta text-sm">{what}</dd>
              </div>
            ))}
          </dl>
        </Surface>
      </Modal>
    </>
  );
}

export default ShortcutsHelp;
