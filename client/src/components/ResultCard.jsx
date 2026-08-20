import { useState } from 'react';
import {
  AppWindow,
  BookOpen,
  Check,
  Disc3,
  Film,
  Headphones,
  Heart,
  Mic,
  Music,
  Tv,
  Video,
} from 'lucide-react';
import IconButton from './ui/IconButton';

// Keyed on the kind the API sends back. A collection has no kind at all, so
// anything unrecognised falls through to the disc
const icons = {
  song: Music,
  album: Disc3,
  podcast: Mic,
  'podcast-episode': Mic,
  ebook: BookOpen,
  software: AppWindow,
  audiobook: Headphones,
  'tv-episode': Tv,
  'music-video': Video,
  'feature-movie': Film,
};

function ResultCard({ item, id, title, isFavourite, addFavourite }) {
  // Artwork comes from Apple and does sometimes 404. A broken image icon in a
  // grid of covers looks like the app is broken, so it gets a real state
  const [failed, setFailed] = useState(false);
  const Icon = icons[item.kind] ?? Disc3;
  const artwork = item.artworkUrl600 ?? item.artworkUrl100;

  return (
    <div className="group flex flex-col">
      {/* Only the artwork lifts. The text underneath staying put is what keeps
          a row of forty cards from feeling like it is breathing */}
      <div className="duration-(--motion-panel) relative aspect-square overflow-hidden rounded-card bg-raised elev-1 transition group-hover:-translate-y-1 group-hover:elev-3">
        {failed || !artwork ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
            <Icon size={28} className="text-muted" aria-hidden="true" />
            <p className="type-eyebrow line-clamp-2">{title}</p>
          </div>
        ) : (
          <img
            src={artwork}
            alt={title}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        )}

        {/* A cover can be any colour, so the corner is darkened before a
            control is put on it */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent opacity-0 transition group-hover:opacity-100"
          aria-hidden="true"
        />

        <IconButton
          className="absolute right-2 bottom-2"
          label={isFavourite ? `Added ${title}` : `Add favourite ${title}`}
          variant={isFavourite ? 'solid' : 'glass'}
          disabled={isFavourite}
          onClick={() =>
            addFavourite({
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
          {isFavourite ? <Check size={16} /> : <Heart size={16} />}
        </IconButton>
      </div>

      <p className="type-title mt-3 line-clamp-2 text-sm">{title}</p>
      <p className="type-meta line-clamp-1 text-sm">{item.artistName}</p>
      <p className="type-meta text-xs">
        {item.releaseDate
          ? new Date(item.releaseDate).toLocaleDateString()
          : 'Unknown'}
      </p>
    </div>
  );
}

export default ResultCard;
