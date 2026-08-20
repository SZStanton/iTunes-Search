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

// Fills whatever it is put in, so the caller owns the size and the corners.
// Artwork comes from Apple and does sometimes 404, and a broken image glyph in
// a grid of covers looks like the app is broken rather than the picture
function Artwork({
  src,
  title,
  kind,
  iconSize = 28,
  showTitle = false,
  className = '',
}) {
  // Held as the url that failed rather than a flag, so a card reused for a
  // different result on the next page corrects itself
  const [failedSrc, setFailedSrc] = useState(null);
  const Icon = icons[kind] ?? Disc3;

  if (!src || failedSrc === src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-2 text-center">
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
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

export default Artwork;
