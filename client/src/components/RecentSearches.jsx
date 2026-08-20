import { X } from 'lucide-react';
import Button from './ui/Button';

// The last few searches, newest first. Clicking one puts the form back where it
// was and runs it again, which is the whole reason for storing the label rather
// than the API's own media value
function RecentSearches({ searches, onRepeat, onForget, onForgetAll }) {
  if (searches.length === 0) return null;

  return (
    <section
      className="mt-bay flex flex-wrap items-center gap-2"
      aria-label="Recent searches"
    >
      <h2 className="type-eyebrow mr-1">Recent</h2>

      {/* Each chip clips its own corners, so the focus outline on the two
          buttons sits inside rather than being cut off at the rounded edge */}
      {searches.map(search => (
        <span
          className="flex items-stretch overflow-hidden rounded-full border border-line bg-surface elev-1"
          key={search._id}
        >
          <button
            className="type-chrome flex items-center gap-1.5 py-1 pr-2 pl-3 text-sm text-ink transition outline-accent-strong hover:bg-raised focus-visible:-outline-offset-2 focus-visible:outline-2 active:bg-raised"
            type="button"
            onClick={() => onRepeat(search)}
          >
            {search.term}
            <span className="type-eyebrow">{search.media}</span>
          </button>

          <button
            className="border-l border-line px-2 text-muted transition outline-accent-strong hover:bg-danger-surface hover:text-danger focus-visible:-outline-offset-2 focus-visible:outline-2 active:bg-danger-surface active:text-danger"
            type="button"
            onClick={() => onForget(search._id)}
            aria-label={`Forget ${search.term}`}
          >
            <X size={14} />
          </button>
        </span>
      ))}

      <Button variant="ghost" size="sm" className="ml-1" onClick={onForgetAll}>
        Clear all
      </Button>
    </section>
  );
}

export default RecentSearches;
