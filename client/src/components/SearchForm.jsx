import { MagnifyingGlass, X } from '@phosphor-icons/react';
import MediaChips from './MediaChips';
import Button from './ui/Button';
import IconButton from './ui/IconButton';
import Input from './ui/Input';

function SearchForm({
  term,
  setTerm,
  media,
  setMedia,
  searchMedia,
  loading,
  fieldRef,
}) {
  // Re-run on a type change, or the filter needs a second click to apply.
  const changeMedia = next => {
    setMedia(next);
    if (term.trim()) searchMedia(term, next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="relative min-w-0 flex-1">
          <MagnifyingGlass
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
            size={18}
            aria-hidden="true"
          />

          <Input
            ref={fieldRef}
            type="text"
            shape="pill"
            size="lg"
            className="pr-12 pl-11"
            placeholder="Search iTunes..."
            value={term}
            onChange={e => setTerm(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !loading) searchMedia();
            }}
          />

          {term && (
            <IconButton
              className="absolute top-1/2 right-2 -translate-y-1/2"
              label="Clear search"
              size="sm"
              onClick={() => setTerm('')}
            >
              <X size={16} />
            </IconButton>
          )}
        </div>

        <Button
          className="shrink-0"
          variant="primary"
          size="lg"
          onClick={() => searchMedia()}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* One control at every width. The dropdown this replaced left the
          field 94px wide on a phone. */}
      <MediaChips media={media} setMedia={changeMedia} />
    </div>
  );
}

export default SearchForm;
