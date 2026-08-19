function SearchForm({ term, setTerm, media, setMedia, searchMedia, loading }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {/* Search Input */}
      <input
        type="text"
        className="min-w-0 flex-1 rounded-full border border-line bg-surface px-5 py-2.5 text-ink outline-none transition placeholder:text-muted focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/30"
        placeholder="Search iTunes..."
        value={term}
        onChange={e => setTerm(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !loading) searchMedia();
        }}
      />

      {/* Media Selector */}
      <select
        className="rounded-full border border-line bg-surface px-4 py-2.5 text-ink outline-none transition focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/30"
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
      <button
        className="rounded-full bg-accent-strong px-6 py-2.5 font-medium text-accent-ink transition hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => searchMedia()}
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </div>
  );
}

export default SearchForm;
