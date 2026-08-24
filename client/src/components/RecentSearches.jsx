import { ArrowCounterClockwise } from '@phosphor-icons/react';

// Newest first, repeat only. Forgetting and clearing live in the drawer.
function RecentSearches({ searches, onRepeat }) {
  if (searches.length === 0) return null;

  return (
    // One row, fading at the end. A long phrase must not push the results down.
    <section
      className="mt-bay flex items-center gap-2 overflow-hidden [mask-image:linear-gradient(to_right,black_92%,transparent)]"
      aria-label="Recent searches"
    >
      <h2 className="type-eyebrow shrink-0">Recent</h2>

      {searches.map(search => (
        // Quieter than the media chips, which filter rather than shortcut.
        <button
          className="type-chrome focus-ring flex max-w-44 shrink-0 items-center gap-1.5 rounded-full bg-raised px-3 py-1 text-sm text-muted transition hover:text-ink active:text-ink"
          type="button"
          key={search._id}
          title={`${search.term} (${search.media})`}
          onClick={() => onRepeat(search)}
        >
          <ArrowCounterClockwise
            className="shrink-0"
            size={12}
            aria-hidden="true"
          />
          <span className="min-w-0 truncate">{search.term}</span>
          <span className="type-eyebrow shrink-0">{search.media}</span>
        </button>
      ))}
    </section>
  );
}

export default RecentSearches;
