function FavouriteList({ favourites, removeFavourite }) {
  return (
    <div className="favourites-section">
      <h2 className="section-title">Favourites</h2>
      {favourites.length === 0 ? (
        <p>No favourites yet.</p>
      ) : (
        favourites.map(item => (
          <div className="favourite-item" key={item.id}>
            <img
              src={item.artworkUrl100}
              alt={item.title}
              className="favourite-image"
            />

            <div className="favourite-info">
              <p className="favourite-title">{item.title}</p>
              <p className="favourite-artist">{item.artistName}</p>
              <button
                className="btn btn-outline-danger btn-sm favourite-btn"
                onClick={() => removeFavourite(item.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default FavouriteList;
