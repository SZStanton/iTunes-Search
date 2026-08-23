import { useState } from 'react';
import {
  AppWindow,
  BookOpen,
  FilmSlate,
  Headphones,
  Microphone,
  MusicNotes,
  Television,
  VideoCamera,
  VinylRecord,
} from '@phosphor-icons/react';

// A collection carries no kind, so anything unrecognised falls to the disc
const icons = {
  song: MusicNotes,
  album: VinylRecord,
  podcast: Microphone,
  'podcast-episode': Microphone,
  ebook: BookOpen,
  software: AppWindow,
  audiobook: Headphones,
  'tv-episode': Television,
  'music-video': VideoCamera,
  'feature-movie': FilmSlate,
};

// Fills whatever it is put in, so the caller owns the size and the corners.
// Apple's artwork does 404, and a broken image glyph reads as a broken app
function Artwork({
  src,
  title,
  kind,
  iconSize = 28,
  showTitle = false,
  contain = false,
  className = '',
}) {
  // The url that failed rather than a flag, so a card reused for the next
  // page corrects itself
  const [failedSrc, setFailedSrc] = useState(null);
  const Icon = icons[kind] ?? VinylRecord;

  // Never cover. A 600x600bb url keeps the artwork's own shape, so an ebook
  // comes back portrait and covering a square tile would cut its title off
  const box = contain
    ? 'max-h-[74vh] max-w-full object-contain'
    : 'h-full w-full object-contain';

  if (!src || failedSrc === src) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 px-2 text-center ${contain ? 'size-64' : 'h-full w-full'}`}
      >
        <Icon size={iconSize} className="text-muted" aria-hidden="true" />
        {showTitle && <p className="type-eyebrow line-clamp-2">{title}</p>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={`${box} ${className}`}
    />
  );
}

export default Artwork;
