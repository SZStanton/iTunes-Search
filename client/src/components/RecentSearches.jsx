// The last few searches, newest first. Clicking one puts the form back where it
// was and runs it again, which is the whole reason for storing the label rather
// than the API's own media value.
// Repeat only, since forgetting and clearing live in the history drawer
function RecentSearches({ searches, onRepeat }) {
  if (searches.length === 0) return null;

  return (
    <section
      className="mt-bay flex flex-wrap items-center gap-2"
      aria-label="Recent searches"
    >
      <h2 className="type-eyebrow mr-1">Recent</h2>

      {searches.map(search => (
        <button
          className="type-chrome focus-ring flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pr-3 pl-3 text-sm text-ink transition elev-1 hover:bg-raised active:bg-raised"
          type="button"
          key={search._id}
          onClick={() => onRepeat(search)}
        >
          {search.term}
          <span className="type-eyebrow">{search.media}</span>
        </button>
      ))}
    </section>
  );
}

export default RecentSearches;
