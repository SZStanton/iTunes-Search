// The last few searches, newest first. Clicking one puts the form back where it
// was and runs it again, which is the whole reason for storing the label rather
// than the API's own media value
function RecentSearches({ searches, onRepeat, onForget, onForgetAll }) {
  if (searches.length === 0) return null;

  return (
    <section className="recent-searches" aria-label="Recent searches">
      <div className="recent-header">
        <h2 className="recent-title">Recent searches</h2>
        <button
          className="btn btn-link btn-sm"
          type="button"
          onClick={onForgetAll}
        >
          Clear all
        </button>
      </div>

      <ul className="recent-list">
        {searches.map(search => (
          <li className="recent-item" key={search._id}>
            <button
              className="btn btn-outline-secondary btn-sm recent-repeat"
              type="button"
              onClick={() => onRepeat(search)}
            >
              {search.term}
              <span className="recent-media">{search.media}</span>
            </button>

            <button
              className="btn btn-sm recent-forget"
              type="button"
              onClick={() => onForget(search._id)}
              aria-label={`Forget ${search.term}`}
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RecentSearches;
