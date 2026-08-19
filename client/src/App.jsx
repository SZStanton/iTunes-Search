import { useState } from 'react';
import { apiFetch } from './api';
import { useAuth } from './context/useAuth';
import SearchForm from './components/SearchForm';
import ResultsList from './components/ResultsList';
import FavouriteList from './components/FavouriteList';

// What the select offers, mapped to the values the iTunes API expects. Album is
// a media plus an entity, which is why these are pairs rather than strings.
// 'movie' and 'shortFilm' are deliberately absent, Apple returns nothing for
// either in any storefront
const mediaMap = {
  all: {},
  podcast: { media: 'podcast' },
  music: { media: 'music' },
  album: { media: 'music', entity: 'album' },
  'music video': { media: 'musicVideo' },
  audiobook: { media: 'audiobook' },
  'tv show': { media: 'tvShow' },
  software: { media: 'software' },
  ebook: { media: 'ebook' },
};

// iTunes ignores an offset, so one search asks for as much as it will give and
// the pages are cut from that
const FETCH_LIMIT = 200;
const PAGE_SIZE = 40;

function App() {
  // The token comes from the session now, so there is nothing to wait for
  const { token, user, logout } = useAuth();

  // == STATE ==
  // Stores search input value
  const [term, setTerm] = useState('');
  // Stores selected media type
  const [media, setMedia] = useState('music');
  // Everything the last search returned, not just the page on screen
  const [allResults, setAllResults] = useState([]);
  // Stores user's favourites during the session
  const [favourites, setFavourites] = useState([]);
  // Controls loading state while fetching data
  const [loading, setLoading] = useState(false);
  // Whatever went wrong last, shown above the results
  const [error, setError] = useState('');
  // Tells an empty list apart from not having searched yet
  const [searched, setSearched] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);

  // == SEARCH API ==
  // Sends a search request to backend
  const searchMedia = async () => {
    if (!term.trim()) return;

    setLoading(true);
    setError('');
    setAllResults([]);
    setPage(0);

    try {
      const filter = mediaMap[media] ?? {};
      const query = new URLSearchParams({ term, limit: FETCH_LIMIT });

      if (filter.media) query.set('media', filter.media);
      if (filter.entity) query.set('entity', filter.entity);

      const data = await apiFetch(`/api/itunes/search?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAllResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);

      // An expired token, or an account the retention sweep has removed. Every
      // later search would fail the same way, so end the session instead
      if (err.status === 401 || err.status === 403) {
        logout();
        return;
      }

      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  // == FAVOURITES ==
  // Add item to favourites
  const addFavourite = item => {
    if (favourites.some(f => f.id === item.id)) return;
    setFavourites([...favourites, item]);
  };

  // Remove an item from favourites
  const removeFavourite = id => {
    setFavourites(favourites.filter(item => item.id !== id));
  };

  // == PAGING ==
  const pageCount = Math.ceil(allResults.length / PAGE_SIZE);
  const results = allResults.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // == UI ==
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">iTunes Search App</h1>

        <div className="app-account">
          <span className="app-email">{user?.email}</span>
          <button
            className="btn btn-outline-secondary btn-sm"
            type="button"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </header>

      <SearchForm
        term={term}
        setTerm={setTerm}
        media={media}
        setMedia={setMedia}
        searchMedia={searchMedia}
        loading={loading}
      />

      {error && (
        <p className="search-error" role="alert">
          {error}
        </p>
      )}

      <div className="content-grid">
        <ResultsList
          results={results}
          favourites={favourites}
          addFavourite={addFavourite}
          searched={searched && !loading && !error}
        />

        <FavouriteList
          favourites={favourites}
          removeFavourite={removeFavourite}
        />
      </div>

      {pageCount > 1 && (
        <div className="pagination-controls">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            Prev
          </button>

          <span className="page-count">
            Page {page + 1} of {pageCount}
          </span>

          <button
            disabled={page + 1 >= pageCount}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
