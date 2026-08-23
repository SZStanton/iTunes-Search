import { MagnifyingGlassMinus } from '@phosphor-icons/react';
import ResultCard from './ResultCard';

function ResultsList({
  results,
  favourites,
  addFavourite,
  removeFavourite,
  searched = false,
}) {
  if (searched && results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-page text-center">
        <span className="grid size-14 place-items-center rounded-full bg-raised text-muted">
          <MagnifyingGlassMinus size={26} />
        </span>
        <p className="type-title text-lg">Nothing matched that search</p>
        <p className="type-meta max-w-xs text-sm">
          Try a different spelling, or widen the media type to All.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {results.map((item, index) => {
        // A track's collectionId is its album, so every song on one album
        // shared an id and the list blocked all but the first as a duplicate
        const id = item.trackId ?? item.collectionId;
        const title = item.trackName ?? item.collectionName;

        return (
          <ResultCard
            key={id ?? index}
            item={item}
            id={id}
            title={title}
            isFavourite={favourites.some(favourite => favourite.id === id)}
            addFavourite={addFavourite}
            removeFavourite={removeFavourite}
          />
        );
      })}
    </div>
  );
}

export default ResultsList;
