import { Search } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';

function SearchForm({ term, setTerm, media, setMedia, searchMedia, loading }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {/* Search Input */}
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
          size={18}
          aria-hidden="true"
        />

        <Input
          type="text"
          shape="pill"
          className="pl-11"
          placeholder="Search iTunes..."
          value={term}
          onChange={e => setTerm(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !loading) searchMedia();
          }}
        />
      </div>

      {/* Media Selector */}
      <select
        className="type-chrome focus-ring rounded-full border border-line bg-surface px-4 py-2.5 text-ink outline-none transition"
        value={media}
        onChange={e => setMedia(e.target.value)}
      >
        <option value="all">ALL</option>
        <option value="podcast">Podcast</option>
        <option value="music">Music</option>
        <option value="album">Album</option>
        <option value="music video">Music Video</option>
        <option value="audiobook">Audiobook</option>
        <option value="tv show">TV Show</option>
        <option value="software">Software</option>
        <option value="ebook">Ebook</option>
      </select>

      {/* Search Button */}
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
  );
}

export default SearchForm;
