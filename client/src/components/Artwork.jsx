import { useState } from 'react';
import {
  AppWindow,
  BookOpen,
  Disc3,
  Film,
  Headphones,
  Mic,
  Music,
  Tv,
  Video,
} from 'lucide-react';

// A collection carries no kind, so anything unrecognised falls to the disc
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
  const Icon = icons[kind] ?? Disc3;

  // Contained artwork sizes itself, since a viewer holds covers that are not
  // square and cropping one to fit is the whole thing it is there to avoid
  const box = contain
    ? 'max-h-[70vh] max-w-full object-contain'
    : 'h-full w-full object-cover';

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
