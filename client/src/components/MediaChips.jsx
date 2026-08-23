import { MEDIA_TYPES } from '../media';

function MediaChips({ media, setMedia, className = '' }) {
  return (
    // A rail on a phone, bleeding into the page padding so the last chip is
    // visibly cut and reads as scrollable. It wraps once there is room
    <div
      className={`no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 ${className}`}
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
            // The label is what is read, the value is what the query sends, and
            // the mirrored test checks the values against the server's list
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
