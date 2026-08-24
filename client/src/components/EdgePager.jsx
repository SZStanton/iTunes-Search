import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useOverlayOpen } from '../context/useOverlay';

// As wide as the empty margin beside the content column, not a flat percentage
// of the screen, which would sit on top of the outer column of cards
const strip =
  'group fixed inset-y-0 z-0 hidden w-[calc((100vw-80rem)/2)] place-items-center text-muted transition hover:bg-surface/40 disabled:pointer-events-none disabled:opacity-0 xl:grid';

function EdgePager({ page, pageCount, onPage }) {
  const overlayOpen = useOverlayOpen();

  // Nothing to click on while a viewer or a drawer is up, so a click aimed at
  // the backdrop cannot page the grid underneath it
  if (pageCount <= 1 || overlayOpen) return null;

  return (
    <>
      {/* Hidden from screen readers and off the tab order on purpose, since
          the Prev and Next buttons below the grid are the real controls */}
      <button
        className={`${strip} left-0`}
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
        tabIndex={-1}
        aria-hidden="true"
      >
        <CaretLeft
          size={24}
          className="opacity-0 transition group-hover:opacity-100"
        />
      </button>

      <button
        className={`${strip} right-0`}
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page + 1 >= pageCount}
        tabIndex={-1}
        aria-hidden="true"
      >
        <CaretRight
          size={24}
          className="opacity-0 transition group-hover:opacity-100"
        />
      </button>
    </>
  );
}

export default EdgePager;
