function ResultsList({ results, favourites, addFavourite }) {
  return (
    <div className="results-section">
      <h2 className="section-title">Search Results</h2>

      <div className="results-grid">
        {results.map((item, index) => {
          const id = item.collectionId || item.trackId;
          const title = item.collectionName || item.trackName;
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
