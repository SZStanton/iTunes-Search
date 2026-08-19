function SearchForm({
  term,
  setTerm,
  media,
  setMedia,
  searchMedia,
  loading,
  // The search needs a token, and it arrives a moment after the page does
  ready = true,
}) {
  const busy = loading || !ready;

  return (
    <div className="search-form">
      <div className="row g-3">
        {/* Search Input */}
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search iTunes..."
            value={term}
            onChange={e => setTerm(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !busy) searchMedia();
            }}
          />
        </div>

        {/* Media Selector */}
        <div className="col-md-3">
          <select
            className="form-select"
            value={media}
            onChange={e => setMedia(e.target.value)}
          >
            <option value="all">ALL</option>
            <option value="podcast">Podcast</option>
            <option value="music">Music</option>
            <option value="album">Album</option>
            <option value="music video">Music Video</option>
            <option value="audiobook">Audiobook</option>
            <option value="tv show">TV Show</option>
            <option value="software">Software</option>
            <option value="ebook">Ebook</option>
          </select>
        </div>

        {/* Search Button */}
        <div className="col-md-3">
          <button
            className="btn btn-primary search-button"
            onClick={() => searchMedia()}
            disabled={busy}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchForm;
