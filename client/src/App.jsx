import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Books,
  CaretLeft,
  CaretRight,
  Clock,
  Heart,
  WarningCircle,
} from '@phosphor-icons/react';
import { authFetch } from './api';
import { typingIn } from './keys';
import { mediaFilter } from './media';
import { sortResults } from './sorting';
import { useAuth } from './context/useAuth';
import { useOverlayOpen } from './context/useOverlay';
import { useSwipe } from './components/ui/useSwipe';
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

// iTunes ignores offset, so one request fetches the lot and pages come from it.
const FETCH_LIMIT = 200;
const PAGE_SIZE = 40;

// Map a stored favourite onto the iTunes field names the cards expect.
function toCard(favourite) {
  return {
    id: favourite.itemId,
    title: favourite.title,
    artistName: favourite.artist,
    artworkUrl100: favourite.artwork,
    releaseDate: favourite.releaseDate,
    // Only read when the artwork fails, to pick the placeholder icon.
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
  // The session already holds the token, so there is nothing to wait for.
  const { token, user, logout } = useAuth();

  // == STATE ==
  const [term, setTerm] = useState('');
  const [media, setMedia] = useState('music');
  // Everything the last search returned, not just the page on screen.
  const [allResults, setAllResults] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(false);
  // Whatever went wrong last, shown above the results.
  const [error, setError] = useState('');
  // Tells an empty result set apart from not having searched yet.
  const [searched, setSearched] = useState(false);
  // What is on screen, not what is in the form.
  const [ran, setRan] = useState({ term: '', media: '' });

  const [page, setPage] = useState(0);

  // Session only. How one search is ordered says nothing about the next.
  const [sort, setSort] = useState('relevance');
  const [reversed, setReversed] = useState(false);

  // The last few searches, newest first.
  const [recent, setRecent] = useState([]);
  // One panel for both lists. null when shut, otherwise the tab it is on.
  const [library, setLibrary] = useState(null);
  // Separate from the page banner, which sits under the drawer's backdrop.
  const [libraryError, setLibraryError] = useState('');
  const closeLibrary = useCallback(() => {
    setLibrary(null);
    setLibraryError('');
  }, []);

  const searchField = useRef(null);
  // The grid only. A flick along the chip rail must not also turn the page.
  const resultsArea = useRef(null);

  useEffect(() => {
    libraryNow.current = library;
  }, [library]);

  // Ticket every refetch so a late reply cannot overwrite a newer list.
  const historyTicket = useRef(0);
  // One request per row, so forgetting one never blocks forgetting another.
  const forgetting = useRef(new Set());
  // Where the drawer is now, not where it was when the click happened.
  const libraryNow = useRef(library);
  const overlayOpen = useOverlayOpen();

  // == LOADING WHAT THE ACCOUNT ALREADY HAS ==
  // A failure here is not worth a banner. The app just starts empty.
  useEffect(() => {
    let cancelled = false;

    // allSettled, so one list failing does not take the other down with it.
    const load = async () => {
      // Claim the ticket first, or a late reply always looks like the newest.
      const ticket = (historyTicket.current += 1);

      const [saved, history] = await Promise.allSettled([
        authFetch('/api/favourites', token),
        authFetch('/api/searches', token),
      ]);

      if (cancelled) return;

      if (saved.status === 'fulfilled') {
        setFavourites((saved.value?.favourites ?? []).map(toCard));
      } else {
        console.error('Could not load your favourites:', saved.reason);
      }

      if (history.status === 'fulfilled' && ticket === historyTicket.current) {
        setRecent(history.value?.searches ?? []);
      } else if (history.status === 'rejected') {
        console.error('Could not load your searches:', history.reason);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // == SEARCH API ==
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

      // Only remember a search that worked, so a failed typo takes no slot.
      rememberSearch(searchTerm, searchMediaLabel);
    } catch (err) {
      console.error('Search failed:', err);

      // Expired token, or a swept account. Every later call fails the same way.
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
  // The server owns the order and the ten item cap, so every write refetches.
  const loadHistory = async () => {
    const ticket = (historyTicket.current += 1);

    try {
      const history = await authFetch('/api/searches', token);
      if (ticket !== historyTicket.current) return;

      setRecent(history.searches ?? []);
    } catch (err) {
      console.error('Could not load your searches:', err);
    }
  };

  const rememberSearch = async (searchTerm, searchMediaLabel) => {
    try {
      await authFetch('/api/searches', token, {
        method: 'POST',
        body: JSON.stringify({ term: searchTerm, media: searchMediaLabel }),
      });
    } catch (err) {
      // Not being remembered is not worth interrupting anyone over.
      console.error('Could not remember that search:', err);
      return;
    }

    await loadHistory();
  };

  // Clicking one puts the form back where it was and runs it again.
  const repeatSearch = search => {
    setTerm(search.term);
    setMedia(search.media);
    searchMedia(search.term, search.media);
  };

  const forgetSearch = async id => {
    if (forgetting.current.has(id)) return;
    if (!recent.some(search => search._id === id)) return;

    const previous = recent;

    forgetting.current.add(id);
    setLibraryError('');
    setRecent(current => current.filter(search => search._id !== id));

    try {
      await authFetch(`/api/searches/${id}`, token, { method: 'DELETE' });
    } catch (err) {
      console.error('Could not forget that search:', err);
      // Restore from the snapshot, not the server that just failed to answer.
      setRecent(previous);
      setLibraryError(err.message || 'Could not forget that search.');
    } finally {
      forgetting.current.delete(id);
    }

    // Reconcile either way, so a snapshot cannot resurrect a deleted row.
    await loadHistory();
  };

  const forgetAllSearches = async () => {
    const previous = recent;

    setLibraryError('');
    setRecent([]);

    try {
      await authFetch('/api/searches', token, { method: 'DELETE' });
    } catch (err) {
      console.error('Could not clear your searches:', err);
      setRecent(previous);
      setLibraryError(err.message || 'Could not clear your searches.');
    }

    await loadHistory();
  };

  // == FAVOURITES ==
  // Update the screen first and undo it if the server refuses.

  // One request per item, or a spammed heart races an add against a delete.
  const inFlight = useRef(new Set());

  // Route the error to whichever of the card or drawer is being looked at.
  const reportFavourite = message =>
    libraryNow.current === null ? setError(message) : setLibraryError(message);

  const addFavourite = async item => {
    if (inFlight.current.has(item.id)) return;
    if (favourites.some(f => f.id === item.id)) return;

    inFlight.current.add(item.id);
    setLibraryError('');
    setFavourites(current => [...current, item]);

    try {
      await authFetch('/api/favourites', token, {
        method: 'POST',
        body: JSON.stringify(toStored(item)),
      });
    } catch (err) {
      console.error('Could not save that favourite:', err);
      setFavourites(current => current.filter(f => f.id !== item.id));
      reportFavourite(err.message || 'Could not save that favourite.');
    } finally {
      inFlight.current.delete(item.id);
    }
  };

  const removeFavourite = async id => {
    if (inFlight.current.has(id)) return;

    // Keep the index so a failed delete puts it back in place.
    const index = favourites.findIndex(item => item.id === id);
    if (index === -1) return;

    const removed = favourites[index];

    inFlight.current.add(id);
    setLibraryError('');
    setFavourites(current => current.filter(item => item.id !== id));

    try {
      await authFetch(`/api/favourites/${id}`, token, { method: 'DELETE' });
    } catch (err) {
      console.error('Could not remove that favourite:', err);
      setFavourites(current => current.toSpliced(index, 0, removed));
      reportFavourite(err.message || 'Could not remove that favourite.');
    } finally {
      inFlight.current.delete(id);
    }
  };

  // == SORTING AND PAGING ==
  // Sort the whole set, not just the forty on screen.
  const sorted = sortResults(allResults, sort, reversed);
  const pageCount = Math.ceil(sorted.length / PAGE_SIZE);
  const results = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Page four of the old order means nothing in the new one.
  const changeSort = next => {
    setSort(next);
    setPage(0);
  };

  const reverseSort = () => {
    setReversed(current => !current);
    setPage(0);
  };

  // Scroll up, or new cards under a scrolled window look like nothing happened.
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

  // == SWIPING ==
  // Same gates as the arrow keys.
  useSwipe(resultsArea, {
    enabled: pageCount > 1 && !overlayOpen && !loading,
    onLeft: () => goToPage(page + 1),
    onRight: () => goToPage(page - 1),
  });

  // == KEYBOARD ==
  useEffect(() => {
    const onKeyDown = event => {
      if (typingIn(event.target)) return;

      if (event.key === '/') {
        event.preventDefault();
        searchField.current?.focus();
        return;
      }

      // An open overlay owns the arrow keys.
      if (overlayOpen) return;

      if (event.key === 'ArrowLeft') goToPage(page - 1);
      if (event.key === 'ArrowRight') goToPage(page + 1);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToPage, page, overlayOpen]);

  // == UI ==
  // No bg-page here, or it paints over the body's ground gradient.
  return (
    <div className="min-h-screen">
      {/* Stays put while a page of results scrolls under it. */}
      <header className="glass sticky top-0 z-10 border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center gap-x-2 px-4 py-3 sm:gap-x-4 sm:px-6">
          {/* Nowrap and a size down, or the row breaks mid word at 320. */}
          <h1 className="type-title mr-auto whitespace-nowrap text-base sm:text-lg">
            iTunes Search
          </h1>

          {/* A max-* variant, since plain hidden loses to the button's own
              inline-flex. */}
          <Button
            className="max-md:hidden"
            onClick={() => setLibrary('history')}
            aria-label={`History, ${recent.length} searches`}
          >
            <Clock size={16} />
            History
            <Badge>{recent.length}</Badge>
          </Button>

          <Button
            className="max-md:hidden"
            onClick={() => setLibrary('favourites')}
            aria-label={`Favourites, ${favourites.length} saved`}
          >
            <Heart size={16} />
            Favourites
            <Badge>{favourites.length}</Badge>
          </Button>

          {/* Both lists behind one control on a phone. It opens on favourites,
              so badge those. */}
          <IconButton
            className="relative md:hidden"
            label={`Favourites and history, ${favourites.length} favourites saved`}
            onClick={() => setLibrary('favourites')}
          >
            <Books size={20} />
            {favourites.length > 0 && (
              <Badge className="absolute -top-1 -right-1">
                {favourites.length}
              </Badge>
            )}
          </IconButton>

          {/* Cap it, or a long address pushes Sign out off the row. */}
          <span className="type-meta max-w-[26ch] truncate text-sm max-lg:hidden">
            {user?.email}
          </span>

          {/* No keyboard on a phone, so this only shows above sm. */}
          <ShortcutsHelp className="max-sm:hidden" />

          <ThemeToggle />

          {/* Narrower below sm, purely to buy back the last few pixels. */}
          <Button variant="ghost" className="max-sm:px-2.5" onClick={logout}>
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
            <WarningCircle size={16} className="shrink-0" />
            {error}
          </p>
        )}

        {!loading && allResults.length > 0 && (
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

        {/* pan-y stops the browser claiming a sideways drag. pinch-zoom keeps
            the artwork zoomable. */}
        <div className="mt-snug touch-pan-y touch-pinch-zoom" ref={resultsArea}>
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
              <CaretLeft size={16} />
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
              <CaretRight size={16} />
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
        error={libraryError}
      />
    </div>
  );
}

export default App;
