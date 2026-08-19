import { useCallback, useEffect, useState } from 'react';
import { authFetch } from './api';
import { useAuth } from './context/useAuth';
import SearchForm from './components/SearchForm';
import RecentSearches from './components/RecentSearches';
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

// The API stores a favourite in its own shape. The cards were written against
// the iTunes field names, so the translation happens here rather than in both
function toCard(favourite) {
  return {
    id: favourite.itemId,
    title: favourite.title,
    artistName: favourite.artist,
    artworkUrl100: favourite.artwork,
  };
}

function toStored(item) {
  return {
    itemId: item.id,
    title: item.title,
    artist: item.artistName ?? '',
    artwork: item.artworkUrl100 ?? '',
    releaseDate: item.releaseDate,
    kind: item.kind,
  };
}

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

  // The last few searches, newest first
  const [recent, setRecent] = useState([]);

  // == LOADING WHAT THE ACCOUNT ALREADY HAS ==
  // A failure here is not worth an error banner. The app still works, it just
  // starts empty, and the next action will surface anything that is really wrong
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [saved, history] = await Promise.all([
          authFetch('/api/favourites', token),
          authFetch('/api/searches', token),
        ]);

        if (cancelled) return;

        setFavourites((saved.favourites ?? []).map(toCard));
        setRecent(history.searches ?? []);
      } catch (err) {
        console.error('Could not load your account:', err);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // == SEARCH API ==
  // Sends a search request to backend
  const searchMedia = async (searchTerm = term, searchMediaLabel = media) => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');
    setAllResults([]);
    setPage(0);

    try {
      const filter = mediaMap[searchMediaLabel] ?? {};
      const query = new URLSearchParams({
        term: searchTerm,
        limit: FETCH_LIMIT,
      });

      if (filter.media) query.set('media', filter.media);
      if (filter.entity) query.set('entity', filter.entity);

      const data = await authFetch(`/api/itunes/search?${query}`, token);

      setAllResults(data.results || []);

      // Remembered only once the search worked, so a typo that errors does not
      // take one of the ten slots
      rememberSearch(searchTerm, searchMediaLabel);
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

  // == SEARCH HISTORY ==
  const rememberSearch = useCallback(
    async (searchTerm, searchMediaLabel) => {
      try {
        await authFetch('/api/searches', token, {
          method: 'POST',
          body: JSON.stringify({ term: searchTerm, media: searchMediaLabel }),
        });

        const history = await authFetch('/api/searches', token);
        setRecent(history.searches ?? []);
      } catch (err) {
        // Not being remembered is not worth interrupting anyone over
        console.error('Could not remember that search:', err);
      }
    },
    [token],
  );

  // Clicking one puts the form back where it was and runs it again
  const repeatSearch = search => {
    setTerm(search.term);
    setMedia(search.media);
    searchMedia(search.term, search.media);
  };

  const forgetSearch = async id => {
    setRecent(recent.filter(search => search._id !== id));

    try {
      await authFetch(`/api/searches/${id}`, token, { method: 'DELETE' });
    } catch (err) {
      console.error('Could not forget that search:', err);
    }
  };

  const forgetAllSearches = async () => {
    setRecent([]);

    try {
      await authFetch('/api/searches', token, { method: 'DELETE' });
    } catch (err) {
      console.error('Could not clear your searches:', err);
    }
  };

  // == FAVOURITES ==
  // Shown straight away and undone if the server refuses, since waiting for a
  // round trip to tick a button reads as a broken click
  const addFavourite = async item => {
    if (favourites.some(f => f.id === item.id)) return;

    setFavourites(current => [...current, item]);

    try {
      await authFetch('/api/favourites', token, {
        method: 'POST',
        body: JSON.stringify(toStored(item)),
      });
    } catch (err) {
      console.error('Could not save that favourite:', err);
      setFavourites(current => current.filter(f => f.id !== item.id));
      setError(err.message || 'Could not save that favourite.');
    }
  };

  // Remove an item from favourites
  const removeFavourite = async id => {
    const previous = favourites;
    setFavourites(favourites.filter(item => item.id !== id));

    try {
      await authFetch(`/api/favourites/${id}`, token, { method: 'DELETE' });
    } catch (err) {
      console.error('Could not remove that favourite:', err);
      setFavourites(previous);
      setError(err.message || 'Could not remove that favourite.');
    }
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

      <RecentSearches
        searches={recent}
        onRepeat={repeatSearch}
        onForget={forgetSearch}
        onForgetAll={forgetAllSearches}
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
