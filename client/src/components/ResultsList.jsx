function ResultsList({ results, favourites, addFavourite, searched = false }) {
  if (searched && results.length === 0) {
    return (
      <p className="py-16 text-center text-muted">
        Nothing matched that search.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {results.map((item, index) => {
        // A track's collectionId is its album, so every song on one album
        // shared an id and the list blocked all but the first as a duplicate
        const id = item.trackId ?? item.collectionId;
        const title = item.trackName ?? item.collectionName;
        const isFavourite = favourites.some(favourite => favourite.id === id);

        return (
          <div key={id ?? index} className="group flex flex-col">
            <div className="relative aspect-square overflow-hidden rounded-card bg-raised card-shadow">
              <img
                src={item.artworkUrl600 ?? item.artworkUrl100}
                alt={title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />

              <button
                className={`absolute right-2 bottom-2 rounded-full px-3 py-1.5 text-sm font-medium backdrop-blur transition ${
                  isFavourite
                    ? 'cursor-default bg-accent-strong/90 text-accent-ink'
                    : 'bg-surface/80 text-ink hover:bg-surface active:scale-95'
                }`}
                disabled={isFavourite}
                aria-label={
                  isFavourite ? `Added ${title}` : `Add favourite ${title}`
                }
                onClick={() =>
                  addFavourite({
                    id,
                    title,
                    artistName: item.artistName,
                    // The big one, so a saved favourite is not stuck at 100px
                    artworkUrl100: item.artworkUrl600 ?? item.artworkUrl100,
                    releaseDate: item.releaseDate,
                    kind: item.kind,
                  })
                }
              >
                {isFavourite ? 'Added' : 'Add'}
              </button>
            </div>

            <p className="mt-3 line-clamp-2 font-medium text-ink">{title}</p>
            <p className="line-clamp-1 text-sm text-muted">{item.artistName}</p>
            <p className="text-sm text-muted">
              {item.releaseDate
                ? new Date(item.releaseDate).toLocaleDateString()
                : 'Unknown'}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default ResultsList;
