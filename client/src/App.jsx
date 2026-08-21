import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  Heart,
  Library,
} from 'lucide-react';
import { authFetch } from './api';
import { typingIn } from './keys';
import { mediaFilter } from './media';
import { sortResults } from './sorting';
import { useAuth } from './context/useAuth';
import { useOverlayOpen } from './context/useOverlay';
import SearchForm from './components/SearchForm';
import EdgePager from './components/EdgePager';
import FirstVisit from './components/FirstVisit';
import ShortcutsHelp from './components/ShortcutsHelp';
import RecentSearches from './components/RecentSearches';
import ResultsHeader from './components/ResultsHeader';
import SortControl from './components/SortControl';
import ResultsList from './components/ResultsList';
import ResultsSkeleton from './components/ResultsSkeleton';
import LibraryDrawer from './components/LibraryDrawer';
import ThemeToggle from './components/ThemeToggle';
import Badge from './components/ui/Badge';
import Button from './components/ui/Button';
import IconButton from './components/ui/IconButton';

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
    // Only read when the artwork fails, to pick the placeholder icon
    kind: favourite.kind,
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
  // What is on screen, not what is in the form, which changes on every keypress
  const [ran, setRan] = useState({ term: '', media: '' });

  // Pagination state
  const [page, setPage] = useState(0);

  // Session only, on purpose. How someone wants one search ordered says
  // nothing about the next one
  const [sort, setSort] = useState('relevance');
  const [reversed, setReversed] = useState(false);

  // The last few searches, newest first
  const [recent, setRecent] = useState([]);
  // One panel holding both lists. null when shut, otherwise the tab it is on
  const [library, setLibrary] = useState(null);
  const closeLibrary = useCallback(() => setLibrary(null), []);

  const searchField = useRef(null);
  const overlayOpen = useOverlayOpen();

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
      const filter = mediaFilter(searchMediaLabel);
      const query = new URLSearchParams({
        term: searchTerm,
        limit: FETCH_LIMIT,
      });

      if (filter.media) query.set('media', filter.media);
      if (filter.entity) query.set('entity', filter.entity);

      const data = await authFetch(`/api/itunes/search?${query}`, token);

      setAllResults(data.results || []);
      setRan({ term: searchTerm, media: searchMediaLabel });

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

  // One request per item at a time, or a spammed heart sends an add and a
  // delete that can land in either order
  const inFlight = useRef(new Set());

  const addFavourite = async item => {
    if (inFlight.current.has(item.id)) return;
    if (favourites.some(f => f.id === item.id)) return;

    inFlight.current.add(item.id);
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
    } finally {
      inFlight.current.delete(item.id);
    }
  };

  // Remove an item from favourites
  const removeFavourite = async id => {
    if (inFlight.current.has(id)) return;

    // Where it was, so a failed delete puts it back in its own place
    const index = favourites.findIndex(item => item.id === id);
    if (index === -1) return;

    const removed = favourites[index];

    inFlight.current.add(id);
    setFavourites(current => current.filter(item => item.id !== id));

    try {
      await authFetch(`/api/favourites/${id}`, token, { method: 'DELETE' });
    } catch (err) {
      console.error('Could not remove that favourite:', err);
      setFavourites(current => current.toSpliced(index, 0, removed));
      setError(err.message || 'Could not remove that favourite.');
    } finally {
      inFlight.current.delete(id);
    }
  };

  // == SORTING AND PAGING ==
  // One request filled allResults, so this reorders the whole set rather than
  // the forty on screen, and it costs nothing
  const sorted = sortResults(allResults, sort, reversed);
  const pageCount = Math.ceil(sorted.length / PAGE_SIZE);
  const results = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Page four of the old order has nothing to do with the new one
  const changeSort = next => {
    setSort(next);
    setPage(0);
  };

  const reverseSort = () => {
    setReversed(current => !current);
    setPage(0);
  };

  // Forty new cards under a scrolled window looks like nothing happened
  const goToPage = useCallback(
    next => {
      if (next < 0 || next >= pageCount) return;

      setPage(next);
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)')
          .matches
          ? 'auto'
          : 'smooth',
      });
    },
    [pageCount],
  );

  // == KEYBOARD ==
  useEffect(() => {
    const onKeyDown = event => {
      if (typingIn(event.target)) return;

      if (event.key === '/') {
        event.preventDefault();
        searchField.current?.focus();
        return;
      }

      // The arrows belong to whatever is over the page while one is open
      if (overlayOpen) return;

      if (event.key === 'ArrowLeft') goToPage(page - 1);
      if (event.key === 'ArrowRight') goToPage(page + 1);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToPage, page, overlayOpen]);

  // == UI ==
  return (
    <div className="min-h-screen bg-page">
      {/* Stays put while a page of results scrolls under it */}
      <header className="glass sticky top-0 z-10 border-b border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <h1 className="type-title mr-auto text-lg">iTunes Search</h1>

          {/* Two ways in on a wide screen, one on a narrow one, so the search
              stays the biggest thing in the bar */}
          <Button
            className="hidden sm:inline-flex"
            onClick={() => setLibrary('history')}
            aria-label={`History, ${recent.length} searches`}
          >
            <Clock size={16} />
            History
            <Badge>{recent.length}</Badge>
          </Button>

          <Button
            className="hidden sm:inline-flex"
            onClick={() => setLibrary('favourites')}
            aria-label={`Favourites, ${favourites.length} saved`}
          >
            <Heart size={16} />
            Favourites
            <Badge>{favourites.length}</Badge>
          </Button>

          <IconButton
            className="sm:hidden"
            label="Favourites and history"
            onClick={() => setLibrary('favourites')}
          >
            <Library size={18} />
          </IconButton>

          <span className="type-meta hidden text-sm sm:inline">
            {user?.email}
          </span>

          <ShortcutsHelp />

          <ThemeToggle />

          <Button variant="ghost" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {!searched && !loading && <FirstVisit />}

        <SearchForm
          fieldRef={searchField}
          term={term}
          setTerm={setTerm}
          media={media}
          setMedia={setMedia}
          searchMedia={searchMedia}
          loading={loading}
        />

        <RecentSearches searches={recent} onRepeat={repeatSearch} />

        {error && (
          <p
            className="mt-bay flex items-center gap-2 rounded-control bg-danger-surface px-4 py-3 text-sm text-danger"
            role="alert"
          >
            <CircleAlert size={16} className="shrink-0" />
            {error}
          </p>
        )}

        {!loading && !error && allResults.length > 0 && (
          <ResultsHeader
            query={ran.term}
            media={ran.media}
            count={sorted.length}
            page={page}
            pageCount={pageCount}
            sort={
              <SortControl
                field={sort}
                reversed={reversed}
                onField={changeSort}
                onReverse={reverseSort}
              />
            }
          />
        )}

        <div className="mt-section">
          {loading ? (
            <ResultsSkeleton />
          ) : (
            <ResultsList
              results={results}
              favourites={favourites}
              addFavourite={addFavourite}
              removeFavourite={removeFavourite}
              searched={searched && !error}
            />
          )}
        </div>

        {pageCount > 1 && (
          <div className="mt-section flex items-center justify-center gap-4">
            <Button disabled={page === 0} onClick={() => goToPage(page - 1)}>
              <ChevronLeft size={16} />
              Prev
            </Button>

            <span className="type-meta text-sm tabular-nums">
              Page {page + 1} of {pageCount}
            </span>

            <Button
              disabled={page + 1 >= pageCount}
              onClick={() => goToPage(page + 1)}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </main>

      <EdgePager page={page} pageCount={pageCount} onPage={goToPage} />

      <LibraryDrawer
        open={library !== null}
        tab={library}
        onTab={setLibrary}
        onClose={closeLibrary}
        favourites={favourites}
        removeFavourite={removeFavourite}
        searches={recent}
        onRepeat={repeatSearch}
        onForget={forgetSearch}
        onForgetAll={forgetAllSearches}
      />
    </div>
  );
}

export default App;
