function ResultsList({ results, favourites, addFavourite, searched = false }) {
  return (
    <div className="results-section">
      <h2 className="section-title">Search Results</h2>

      {searched && results.length === 0 && <p>Nothing matched that search.</p>}

      <div className="results-grid">
        {results.map((item, index) => {
          // A track's collectionId is its album, so every song on one album
          // shared an id and the list blocked all but the first as a duplicate
          const id = item.trackId ?? item.collectionId;
          const title = item.trackName ?? item.collectionName;
          const isFavourite = favourites.some(favourite => favourite.id === id);

          return (
            <div key={id ?? index} className="result-card">
              <img
                src={item.artworkUrl100}
                alt={title}
                className="result-image"
              />
              <div className="result-content">
                <p className="result-title">{title}</p>
                <p className="result-artist">{item.artistName}</p>
                <p className="result-date">
                  {item.releaseDate
                    ? new Date(item.releaseDate).toLocaleDateString()
                    : 'Unknown'}
                </p>
                <button
                  className="btn btn-outline-primary btn-sm"
                  disabled={isFavourite}
                  onClick={() =>
                    addFavourite({
                      id,
                      title,
                      artistName: item.artistName,
                      artworkUrl100: item.artworkUrl100,
                    })
                  }
                >
                  {isFavourite ? 'Added' : 'Add Favourite'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ResultsList;
