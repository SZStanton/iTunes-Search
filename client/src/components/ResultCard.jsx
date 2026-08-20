import { Heart } from 'lucide-react';
import { resultLabel } from '../media';
import Artwork from './Artwork';
import IconButton from './ui/IconButton';

function ResultCard({
  item,
  id,
  title,
  isFavourite,
  addFavourite,
  removeFavourite,
}) {
  const artwork = item.artworkUrl600 ?? item.artworkUrl100;

  return (
    <div className="group flex flex-col">
      {/* Only the artwork lifts, so forty cards do not all shift at once */}
      <div className="duration-(--motion-panel) relative aspect-square overflow-hidden rounded-card bg-raised elev-1 transition group-hover:-translate-y-1 group-hover:elev-3">
        <Artwork
          src={artwork}
          title={title}
          kind={item.kind}
          showTitle
          className="transition duration-500 group-hover:scale-[1.04]"
        />

        {/* A cover can be any colour, so darken the corner under the button */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent opacity-0 transition group-hover:opacity-100"
          aria-hidden="true"
        />

        <IconButton
          className="absolute right-2 bottom-2"
          label={
            isFavourite ? `Remove favourite ${title}` : `Add favourite ${title}`
          }
          variant={isFavourite ? 'solid' : 'glass'}
          aria-pressed={isFavourite}
          onClick={() =>
            isFavourite
              ? removeFavourite(id)
              : addFavourite({
                  id,
                  title,
                  artistName: item.artistName,
                  // The big one, so a saved favourite is not stuck at 100px
                  artworkUrl100: artwork,
                  releaseDate: item.releaseDate,
                  kind: item.kind,
                })
          }
        >
          <Heart size={16} fill={isFavourite ? 'currentColor' : 'none'} />
        </IconButton>
      </div>

      <p className="type-title mt-3 line-clamp-2 text-sm">{title}</p>
      <p className="type-meta line-clamp-1 text-sm">{item.artistName}</p>
      <p className="type-eyebrow mt-0.5">{resultLabel(item)}</p>
    </div>
  );
}

export default ResultCard;
