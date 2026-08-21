import { Search, X } from 'lucide-react';
import { MEDIA_TYPES } from '../media';
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
  // Changing the type with results already up shows them, rather than waiting
  // for a second click on Search
  const changeMedia = next => {
    setMedia(next);
    if (term.trim()) searchMedia(term, next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
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

        {/* The chips take too much room on a phone */}
        <select
          className="type-chrome focus-ring rounded-full border border-line bg-surface px-4 text-ink outline-none transition sm:hidden"
          value={media}
          onChange={e => changeMedia(e.target.value)}
          aria-label="Media type"
        >
          {MEDIA_TYPES.map(type => (
            <option value={type.value} key={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <Button
          variant="primary"
          size="lg"
          onClick={() => searchMedia()}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <MediaChips
        media={media}
        setMedia={changeMedia}
        className="hidden sm:flex"
      />
    </div>
  );
}

export default SearchForm;
