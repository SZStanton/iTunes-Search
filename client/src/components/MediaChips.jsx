import { MEDIA_TYPES } from '../media';

function MediaChips({ media, setMedia, className = '' }) {
  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      role="group"
      aria-label="Media type"
    >
      {MEDIA_TYPES.map(type => {
        const selected = type.value === media;

        return (
          <button
            className={`type-chrome focus-ring rounded-full border px-3 py-1.5 text-sm transition active:scale-95 ${
              selected
                ? 'border-accent-strong bg-accent-strong text-accent-ink'
                : 'border-line bg-surface text-muted hover:border-accent-strong hover:text-ink active:bg-raised'
            }`}
            type="button"
            key={type.value}
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
