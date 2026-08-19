import { useEffect } from 'react';
import FavouriteList from './FavouriteList';

// Slides in over the results rather than taking a third of the page from them.
// Rendered always, moved off screen when shut, so it animates both ways
function FavouritesDrawer({ open, onClose, favourites, removeFavourite }) {
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
        className={`fixed inset-0 z-10 bg-black/40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed top-0 right-0 z-20 flex h-full w-full max-w-sm flex-col border-l border-line bg-surface transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Favourites"
        aria-hidden={open ? undefined : 'true'}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Favourites</h2>

          <button
            className="rounded-full px-3 py-1 text-sm text-muted transition hover:bg-page hover:text-ink active:bg-page active:text-ink"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
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
