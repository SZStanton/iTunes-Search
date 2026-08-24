import { MEDIA_TYPES } from '../media';

function ResultsHeader({ query, media, count, page, pageCount, sort }) {
  const label = MEDIA_TYPES.find(type => type.value === media)?.label;

  return (
    // Stacked on a phone, where sharing the row cut the title short.
    <div className="mt-snug flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="w-full min-w-0 sm:w-auto sm:flex-1">
        {label && <p className="type-eyebrow">{label}</p>}
        {/* One line, or a long search term pushes the whole grid down. */}
        <h2 className="type-title mt-0.5 truncate text-xl" title={query}>
          Results for {query}
        </h2>
      </div>

      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:flex-col sm:items-end">
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
