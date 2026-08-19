// The last few searches, newest first. Clicking one puts the form back where it
// was and runs it again, which is the whole reason for storing the label rather
// than the API's own media value
function RecentSearches({ searches, onRepeat, onForget, onForgetAll }) {
  if (searches.length === 0) return null;

  return (
    <section
      className="mt-4 flex flex-wrap items-center gap-2"
      aria-label="Recent searches"
    >
      <h2 className="mr-1 text-xs font-medium tracking-wide text-muted uppercase">
        Recent
      </h2>

      {searches.map(search => (
        <span
          className="flex items-stretch overflow-hidden rounded-full border border-line bg-surface"
          key={search._id}
        >
          <button
            className="flex items-center gap-1.5 py-1 pr-2 pl-3 text-sm text-ink transition hover:bg-page active:bg-page"
            type="button"
            onClick={() => onRepeat(search)}
          >
            {search.term}
            <span className="text-[0.65rem] tracking-wide text-muted uppercase">
              {search.media}
            </span>
          </button>

          <button
            className="border-l border-line px-2 text-sm text-muted transition hover:bg-danger-surface hover:text-danger active:bg-danger-surface active:text-danger"
            type="button"
            onClick={() => onForget(search._id)}
            aria-label={`Forget ${search.term}`}
          >
            &times;
          </button>
        </span>
      ))}

      <button
        className="ml-1 rounded-full px-2 py-1 text-sm text-muted transition hover:text-ink active:text-ink"
        type="button"
        onClick={onForgetAll}
      >
        Clear all
      </button>
    </section>
  );
}

export default RecentSearches;
