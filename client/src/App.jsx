import { useEffect, useState } from 'react';
import SearchForm from './components/SearchForm';
import ResultsList from './components/ResultsList';
import FavouriteList from './components/FavouriteList';
import './App.css';

function App() {
  // == STATE ==
  // Stores search input value
  const [term, setTerm] = useState('');
  // Stores selected media type
  const [media, setMedia] = useState('music');
  // Stores search results returned from the API
  const [results, setResults] = useState([]);
  // Stores user's favourites during the session
  const [favourites, setFavourites] = useState([]);
  // Controls loading state while fetching data
  const [loading, setLoading] = useState(false);
  // Stores the token
  const [token, setToken] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 40;

  // Gets JWT Token
  useEffect(() => {
    const getToken = async () => {
      try {
        const res = await fetch('/api/token');
        const data = await res.json();
        setToken(data.token);
      } catch (err) {
        console.error('Token load failed:', err);
      }
    };
    getToken();
  }, []);

  // Media Map
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

  // == SEARCH API ==
  // Sends a search request to backend
  const searchMedia = async (newPage = 0) => {
    if (!term.trim()) return;
    setLoading(true);
    setResults([]);

    try {
      const mediaValue = mediaMap[media] ?? '';
      const response = await fetch(
        `/api/itunes/search?term=${encodeURIComponent(term)}&media=${mediaValue}&limit=${limit}&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      const all = (data.results || []).filter(
        item => item.collectionName || item.trackName,
      );

      const pageResults = all.slice(newPage * limit, (newPage + 1) * limit);

      setResults(pageResults);
      setPage(newPage);
      setTotalResults(all.length);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
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

  // == UI ==
  return (
    <div className="app-container">
      <h1 className="app-title">iTunes Search App</h1>

      <SearchForm
        term={term}
        setTerm={setTerm}
        media={media}
        setMedia={setMedia}
        searchMedia={() => searchMedia(0)}
        loading={loading}
      />

      <div className="content-grid">
        <ResultsList
          results={results}
          favourites={favourites}
          addFavourite={addFavourite}
        />

        <FavouriteList
          favourites={favourites}
          removeFavourite={removeFavourite}
        />
      </div>

      <div className="pagination-controls">
        <button
          disabled={page === 0 || loading}
          onClick={() => searchMedia(page - 1)}
        >
          Prev
        </button>
        <button
          disabled={loading || (page + 1) * limit >= totalResults}
          onClick={() => searchMedia(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default App;
