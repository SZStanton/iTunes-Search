import { MEDIA_TYPES } from '../media';

function MediaChips({ media, setMedia, className = '' }) {
  return (
    // A rail on a phone, bleeding past the page padding so the cut last chip
    // reads as scrollable. It wraps once there is room.
    <div
      // Padding cancels the margin, but gives the scroll box room. Without it
      // every chip loses its focus outline and shadow.
      className={`no-scrollbar -mx-4 -my-1.5 flex gap-2 overflow-x-auto px-4 py-1.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 ${className}`}
      role="group"
      aria-label="Media type"
    >
      {MEDIA_TYPES.map(type => {
        const selected = type.value === media;

        return (
          <button
            className={`type-chrome focus-ring shrink-0 rounded-full border px-3 py-1.5 text-sm transition active:scale-95 ${
              selected
                ? 'accent-fill border-accent-deep'
                : 'sheen border-line bg-surface text-muted elev-1 hover:border-accent-strong hover:text-ink active:bg-raised'
            }`}
            type="button"
            key={type.value}
            // The label is read, the value is sent. The mirrored test checks
            // these against the server's list.
            data-media={type.value}
            onClick={() => setMedia(type.value)}
            aria-pressed={selected}
          >
            {type.label}
          </button>
        );
      })}
    </div>
  );
}

export default MediaChips;
