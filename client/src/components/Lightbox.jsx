import { useEffect, useState } from 'react';
import { Heart, X } from '@phosphor-icons/react';
import { cachedColour, dominantColour } from '../dominantColour';
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
  sample,
  isFavourite,
  onFavourite,
}) {
  const [sampled, setSampled] = useState(null);

  // Read every render, not once on mount: this is mounted with the card, long
  // before the hover that fills the cache
  const bloom = sampled ?? cachedColour(sample);

  // The 100px artwork, not the 600px one on screen. Sampling asks for its own
  // copy, so the small one lands in a fraction of the time
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    dominantColour(sample).then(colour => {
      if (!cancelled) setSampled(colour);
    });

    return () => {
      cancelled = true;
    };
  }, [open, sample]);

  return (
    <Modal open={open} onClose={onClose} label={title}>
      {/* isolate, or the bloom's negative z-index escapes and paints behind
          the modal backdrop instead of behind the artwork */}
      <div className="relative isolate flex max-h-[90vh] w-fit max-w-[92vw] min-w-72 flex-col gap-3">
        {/* Mounted before the colour arrives so a cold one can fade in. A
            cached colour is there on the first paint and never fades */}
        <div
          className={`duration-(--motion-overlay) pointer-events-none absolute -inset-16 -z-10 rounded-full blur-3xl transition-opacity ${
            bloom ? 'opacity-60' : 'opacity-0'
          }`}
          style={bloom ? { background: `rgb(${bloom.join(' ')})` } : undefined}
          aria-hidden="true"
        />

        {/* w-0 keeps this row out of the width calculation, so the artwork
            sets the width and the credits cut to match */}
        <div className="flex w-0 min-w-full items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="type-title line-clamp-2 text-xl break-words text-overlay-ink">
              {title}
            </h2>
            <p
              className="type-meta truncate text-sm text-overlay-muted"
              title={item.artistName}
            >
              {item.artistName}
            </p>
            {resultLabel(item) && (
              <p className="type-eyebrow mt-1 text-overlay-muted">
                {resultLabel(item)}
              </p>
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
          className="art-edge self-center rounded-panel bg-raised elev-3"
        />

        <Button
          variant={isFavourite ? 'primary' : 'secondary'}
          size="lg"
          onClick={onFavourite}
          aria-pressed={isFavourite}
        >
          <Heart size={16} weight={isFavourite ? 'fill' : 'regular'} />
          {isFavourite ? 'Saved to favourites' : 'Save to favourites'}
        </Button>
      </div>
    </Modal>
  );
}

export default Lightbox;
