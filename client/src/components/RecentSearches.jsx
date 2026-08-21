import { RotateCcw } from 'lucide-react';

// Newest first, and repeat only: forgetting and clearing live in the drawer.
// The stored label is what lets a repeat put the form back as it was
function RecentSearches({ searches, onRepeat }) {
  if (searches.length === 0) return null;

  return (
    // One row, and the last chip fades out rather than being cut in half. The
    // results must not move down because somebody searched for a long phrase
    <section
      className="mt-bay flex items-center gap-2 overflow-hidden [mask-image:linear-gradient(to_right,black_92%,transparent)]"
      aria-label="Recent searches"
    >
      <h2 className="type-eyebrow shrink-0">Recent</h2>

      {searches.map(search => (
        // Quieter than the media chips above, which are a filter rather than
        // a shortcut, and easy to mistake these for at a glance
        <button
          className="type-chrome focus-ring flex max-w-44 shrink-0 items-center gap-1.5 rounded-full bg-raised px-3 py-1 text-sm text-muted transition hover:text-ink active:text-ink"
          type="button"
          key={search._id}
          title={`${search.term} (${search.media})`}
          onClick={() => onRepeat(search)}
        >
          <RotateCcw className="shrink-0" size={12} aria-hidden="true" />
          <span className="min-w-0 truncate">{search.term}</span>
          <span className="type-eyebrow shrink-0">{search.media}</span>
        </button>
      ))}
    </section>
  );
}

export default RecentSearches;
