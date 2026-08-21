import { MEDIA_TYPES } from '../media';

function ResultsHeader({ query, media, count, page, pageCount, sort }) {
  const label = MEDIA_TYPES.find(type => type.value === media)?.label;

  return (
    <div className="mt-section flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        {label && <p className="type-eyebrow">{label}</p>}
        <h2 className="type-title mt-0.5 text-xl break-words">
          Results for {query}
        </h2>
      </div>

      <div className="flex flex-col items-end gap-2">
        {sort}

        <p className="type-meta text-sm tabular-nums" aria-live="polite">
          {count} {count === 1 ? 'result' : 'results'}
          {pageCount > 1 && ` · Page ${page + 1} of ${pageCount}`}
        </p>
      </div>
    </div>
  );
}

export default ResultsHeader;
