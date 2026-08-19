function FavouriteList({ favourites, removeFavourite }) {
  if (favourites.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted">
        No favourites yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1 px-3 py-3">
      {favourites.map(item => (
        <li
          className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-page active:bg-page"
          key={item.id}
        >
          <img
            src={item.artworkUrl100}
            alt={item.title}
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded-md object-cover"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">
              {item.title}
            </p>
            <p className="truncate text-xs text-muted">{item.artistName}</p>
          </div>

          <button
            className="shrink-0 rounded-full px-2 py-1 text-sm text-muted transition hover:bg-danger-surface hover:text-danger active:bg-danger-surface active:text-danger"
            onClick={() => removeFavourite(item.id)}
            aria-label={`Remove ${item.title}`}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}

export default FavouriteList;
