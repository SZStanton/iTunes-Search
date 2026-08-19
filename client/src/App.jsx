import { useEffect, useState } from 'react';
import SearchForm from './components/SearchForm';
import ResultsList from './components/ResultsList';
import FavouriteList from './components/FavouriteList';
import './App.css';

// What the select offers, mapped to the values the iTunes API expects
const mediaMap = {
  movie: 'movie',
  podcast: 'podcast',
  music: 'music',
  audiobook: 'audiobook',
  'short film': 'shortFilm',
  'tv show': 'tvShow',
  software: 'software',
  ebook: 'ebook',
  all: '',
};

// iTunes ignores an offset, so one search asks for as much as it will give and
// the pages are cut from that
const FETCH_LIMIT = 200;
const PAGE_SIZE = 40;

function App() {
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
  // Stores the token
  const [token, setToken] = useState('');
  // Whatever went wrong last, shown above the results
  const [error, setError] = useState('');
  // Tells an empty list apart from not having searched yet
  const [searched, setSearched] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);

  // Gets JWT Token
  useEffect(() => {
    const getToken = async () => {
      try {
        const res = await fetch('/api/token');
        if (!res.ok) throw new Error(`Token request failed: ${res.status}`);

        const data = await res.json();
        setToken(data.token);
      } catch (err) {
        console.error('Token load failed:', err);
        setError('Could not reach the server. Try reloading the page.');
      }
    };
    getToken();
  }, []);

  // == SEARCH API ==
  // Sends a search request to backend
  const searchMedia = async () => {
    if (!term.trim()) return;

    setLoading(true);
    setError('');
    setAllResults([]);
    setPage(0);

    try {
      const query = new URLSearchParams({
        term,
        media: mediaMap[media] ?? '',
        limit: FETCH_LIMIT,
      });

      const response = await fetch(`/api/itunes/search?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // An error body still parses as JSON, so the status has to be checked
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Search failed: ${response.status}`);
      }

      const data = await response.json();

      setAllResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
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
      <h1 className="app-title">iTunes Search App</h1>

      <SearchForm
        term={term}
        setTerm={setTerm}
        media={media}
        setMedia={setMedia}
        searchMedia={searchMedia}
        loading={loading}
        ready={Boolean(token)}
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
