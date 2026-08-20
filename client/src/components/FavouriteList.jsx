import { Heart, X } from 'lucide-react';
import Artwork from './Artwork';
import IconButton from './ui/IconButton';

function FavouriteList({ favourites, removeFavourite }) {
  if (favourites.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-page text-center">
        <span className="grid size-12 place-items-center rounded-full bg-raised text-muted">
          <Heart size={22} />
        </span>
        <p className="type-title text-base">Nothing saved yet</p>
        <p className="type-meta max-w-52 text-sm">
          Add anything from a search and it waits here for you.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1 px-3 py-3">
      {favourites.map(item => (
        <li
          className="group flex items-center gap-3 rounded-control p-2 transition hover:bg-raised active:bg-raised"
          key={item.id}
        >
          <div className="size-12 shrink-0 overflow-hidden rounded-control bg-raised">
            <Artwork
              src={item.artworkUrl100}
              title={item.title}
              kind={item.kind}
              iconSize={18}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="type-title truncate text-sm">{item.title}</p>
            <p className="type-meta truncate text-xs">{item.artistName}</p>
          </div>

          <IconButton
            label={`Remove ${item.title}`}
            variant="danger"
            size="sm"
            onClick={() => removeFavourite(item.id)}
          >
            <X size={16} />
          </IconButton>
        </li>
      ))}
    </ul>
  );
}

export default FavouriteList;
