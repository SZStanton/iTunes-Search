import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useRegisterOverlay } from '../context/useOverlay';
import FavouriteList from './FavouriteList';
import Badge from './ui/Badge';
import IconButton from './ui/IconButton';

// Slides in over the results rather than taking a third of the page from them.
// Rendered always, moved off screen when shut, so it animates both ways
function FavouritesDrawer({ open, onClose, favourites, removeFavourite }) {
  useRegisterOverlay(open);

  // Escape is what people try first on anything that slides over the page
  useEffect(() => {
    if (!open) return;

    const onKeyDown = event => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <>
      {/* Catches a click anywhere else, and dims what is behind */}
      <div
        className={`duration-(--motion-panel) fixed inset-0 z-10 bg-black/50 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`duration-(--motion-panel) fixed top-0 right-0 z-20 flex h-full w-full max-w-sm flex-col border-l border-line bg-surface elev-3 transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Favourites"
        aria-hidden={open ? undefined : 'true'}
      >
        <header className="glass sticky top-0 flex items-center gap-3 border-b border-line px-5 py-4">
          <h2 className="type-title mr-auto flex items-center gap-2 text-lg">
            Favourites
            <Badge tone="quiet">{favourites.length}</Badge>
          </h2>

          <IconButton label="Close favourites" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>

        <div className="flex-1 overflow-y-auto">
          <FavouriteList
            favourites={favourites}
            removeFavourite={removeFavourite}
          />
        </div>
      </aside>
    </>
  );
}

export default FavouritesDrawer;
