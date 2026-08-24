import { ArrowCounterClockwise, Clock, X } from '@phosphor-icons/react';
import { MEDIA_TYPES } from '../media';
import IconButton from './ui/IconButton';

function label(media) {
  return MEDIA_TYPES.find(type => type.value === media)?.label ?? media;
}

function HistoryList({ searches, onRepeat, onForget }) {
  if (searches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-page text-center">
        <span className="grid size-12 place-items-center rounded-full bg-raised text-muted">
          <Clock size={22} />
        </span>
        <p className="type-title text-base">Nothing searched yet</p>
        <p className="type-meta max-w-52 text-sm">
          The last ten searches wait here, ready to run again.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1 px-3 py-3">
      {searches.map(search => (
        <li className="flex items-center gap-1" key={search._id}>
          <button
            className="focus-ring flex min-w-0 flex-1 items-center gap-3 rounded-control p-2 text-left transition hover:bg-raised active:bg-raised"
            type="button"
            onClick={() => onRepeat(search)}
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-control bg-raised text-muted">
              <ArrowCounterClockwise size={18} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="type-title block truncate text-sm">
                {search.term}
              </span>
              <span className="type-eyebrow block">{label(search.media)}</span>
            </span>
          </button>

          <IconButton
            label={`Forget ${search.term}`}
            variant="danger"
            size="sm"
            onClick={() => onForget(search._id)}
          >
            <X size={16} />
          </IconButton>
        </li>
      ))}
    </ul>
  );
}

export default HistoryList;
