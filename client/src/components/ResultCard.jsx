import { useState } from 'react';
import { Heart } from 'lucide-react';
import { dominantColour } from '../dominantColour';
import { resultLabel } from '../media';
import Artwork from './Artwork';
import Lightbox from './Lightbox';
import IconButton from './ui/IconButton';

function ResultCard({
  item,
  id,
  title,
  isFavourite,
  addFavourite,
  removeFavourite,
}) {
  const [viewing, setViewing] = useState(false);
  const artwork = item.artworkUrl600 ?? item.artworkUrl100;
  const sample = item.artworkUrl100 ?? artwork;

  const toggleFavourite = () =>
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
        });

  return (
    <div className="group flex flex-col">
      {/* Only the artwork lifts, so forty cards do not all shift at once */}
      <div className="duration-(--motion-panel) relative aspect-square overflow-hidden rounded-card bg-raised elev-1 transition group-hover:-translate-y-1 group-hover:elev-3">
        {/* Sampled on the way to the click, so the viewer opens with its
            colour rather than catching up a moment later */}
        <button
          className="focus-ring block h-full w-full cursor-zoom-in"
          type="button"
          onClick={() => setViewing(true)}
          onPointerEnter={() => dominantColour(sample)}
          onFocus={() => dominantColour(sample)}
          aria-label={`View ${title}`}
        >
          <Artwork
            src={artwork}
            title={title}
            kind={item.kind}
            showTitle
            className="transition duration-500 group-hover:scale-[1.04]"
          />
        </button>

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
          onClick={toggleFavourite}
        >
          <Heart size={16} fill={isFavourite ? 'currentColor' : 'none'} />
        </IconButton>
      </div>

      {/* One line each, so every card is the same height and the rows line up.
          The viewer has the full title for anything that gets cut */}
      <p className="type-title mt-2 truncate text-sm" title={title}>
        {title}
      </p>
      <p className="type-meta truncate text-xs" title={item.artistName}>
        {item.artistName}
      </p>
      <p className="type-eyebrow truncate">{resultLabel(item)}</p>

      <Lightbox
        open={viewing}
        onClose={() => setViewing(false)}
        item={item}
        title={title}
        artwork={artwork}
        sample={sample}
        isFavourite={isFavourite}
        onFavourite={toggleFavourite}
      />
    </div>
  );
}

export default ResultCard;
