import { useEffect, useState } from 'react';
import { Heart, X } from 'lucide-react';
import { dominantColour } from '../dominantColour';
import { resultLabel } from '../media';
import Artwork from './Artwork';
import Button from './ui/Button';
import IconButton from './ui/IconButton';
import Modal from './ui/Modal';

function Lightbox({
  open,
  onClose,
  item,
  title,
  artwork,
  isFavourite,
  onFavourite,
}) {
  const [bloom, setBloom] = useState(null);

  // Sampled after the viewer is up, so a slow read never holds it back
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    dominantColour(artwork).then(colour => {
      if (!cancelled) setBloom(colour);
    });

    return () => {
      cancelled = true;
    };
  }, [open, artwork]);

  return (
    <Modal open={open} onClose={onClose} label={title}>
      <div className="relative flex max-h-[90vh] w-fit max-w-[92vw] min-w-72 flex-col gap-3">
        {bloom && (
          <div
            className="pointer-events-none absolute -inset-16 -z-10 rounded-full opacity-60 blur-3xl transition-opacity duration-500"
            style={{ background: `rgb(${bloom.join(' ')})` }}
            aria-hidden="true"
          />
        )}

        {/* w-0 keeps this row out of the width calculation, so the artwork
            sets the width and the credits cut to match */}
        <div className="flex w-0 min-w-full items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="type-title line-clamp-2 text-xl break-words">
              {title}
            </h2>
            <p className="type-meta truncate text-sm" title={item.artistName}>
              {item.artistName}
            </p>
            {resultLabel(item) && (
              <p className="type-eyebrow mt-1">{resultLabel(item)}</p>
            )}
          </div>

          <IconButton label="Close" variant="glass" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>

        <Artwork
          src={artwork}
          title={title}
          kind={item.kind}
          iconSize={64}
          contain
          showTitle
          className="self-center rounded-panel bg-raised elev-3"
        />

        <Button
          variant={isFavourite ? 'primary' : 'secondary'}
          size="lg"
          onClick={onFavourite}
          aria-pressed={isFavourite}
        >
          <Heart size={16} fill={isFavourite ? 'currentColor' : 'none'} />
          {isFavourite ? 'Saved to favourites' : 'Save to favourites'}
        </Button>
      </div>
    </Modal>
  );
}

export default Lightbox;
