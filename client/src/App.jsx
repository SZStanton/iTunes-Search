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
    releaseDate: favourite.releaseDate,
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
  const [term, setTerm] = useState('');
  const [media, setMedia] = useState('music');
  // Everything the last search returned, not just the page on screen
  const [allResults, setAllResults] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(false);
  // Whatever went wrong last, shown above the results
  const [error, setError] = useState('');
  // Tells an empty list apart from not having searched yet
  const [searched, setSearched] = useState(false);
  // What is on screen, not what is in the form, which changes on every keypress
  const [ran, setRan] = useState({ term: '', media: '' });

  const [page, setPage] = useState(0);

  // Session only, on purpose. How someone wants one search ordered says
  // nothing about the next one
  const [sort, setSort] = useState('relevance');
  const [reversed, setReversed] = useState(false);

  // The last few searches, newest first
  const [recent, setRecent] = useState([]);
  // One panel holding both lists. null when shut, otherwise the tab it is on
  const [library, setLibrary] = useState(null);
  // Its own, because the page banner sits under the drawer's backdrop
  const [libraryError, setLibraryError] = useState('');
  const closeLibrary = useCallback(() => {
    setLibrary(null);
    setLibraryError('');
  }, []);

  const searchField = useRef(null);
  // The grid only. The chips above it are their own horizontal scroller, and a
  // flick along those must not also turn the page
  const resultsArea = useRef(null);

  useEffect(() => {
    libraryNow.current = library;
  }, [library]);

  // Every refetch takes the next ticket, so one that arrives late cannot
  // overwrite a newer list
  const historyTicket = useRef(0);
  // One request per row, the way favourites work, so forgetting one never
  // blocks forgetting another
  const forgetting = useRef(new Set());
  // Where the drawer is now, not where it was when the click happened
  const libraryNow = useRef(library);
  const overlayOpen = useOverlayOpen();

  // == LOADING WHAT THE ACCOUNT ALREADY HAS ==
  // A failure here is not worth an error banner. The app still works, it just
  // starts empty, and the next action will surface anything that is really wrong
  useEffect(() => {
    let cancelled = false;

    // Settled, not all: these are two unrelated lists, and one failing used to
    // take the other down with it even though its own request had worked
    const load = async () => {
      // Claimed before the request. Taken afterwards it would always look like
      // the newest list even when a search has since written a fresher one
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
  // The server owns the order and the ten item cap, so every write ends by
  // asking it rather than guessing
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
      // Not being remembered is not worth interrupting anyone over
      console.error('Could not remember that search:', err);
      return;
    }

    await loadHistory();
  };

  // Clicking one puts the form back where it was and runs it again
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
      // From the snapshot, not the server, which has just failed to answer
      setRecent(previous);
      setLibraryError(err.message || 'Could not forget that search.');
    } finally {
      forgetting.current.delete(id);
    }

    // Reconciles either way when the server can be reached, so a snapshot
    // cannot resurrect a row another delete removed
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
  // Shown straight away and undone if the server refuses, since waiting for a
  // round trip to tick a button reads as a broken click

  // One request per item at a time, or a spammed heart sends an add and a
  // delete that can land in either order
  const inFlight = useRef(new Set());

  // The heart is on the card and in the drawer, so the message has to follow
  // whichever of the two is being looked at
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

    // Where it was, so a failed delete puts it back in its own place
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
  // One request filled allResults, so this reorders the whole set rather than
  // the forty on screen
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

  // == SWIPING ==
  // Same gates as the arrows: nothing to page through, or something is over
  // the page and owns the gesture
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

      // The arrows belong to whatever is over the page while one is open
      if (overlayOpen) return;

      if (event.key === 'ArrowLeft') goToPage(page - 1);
      if (event.key === 'ArrowRight') goToPage(page + 1);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToPage, page, overlayOpen]);

  // == UI ==
  // No bg-page on the wrapper, or it paints over the body's ground gradient
  return (
    <div className="min-h-screen">
      {/* Stays put while a page of results scrolls under it */}
      <header className="glass sticky top-0 z-10 border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center gap-x-2 px-4 py-3 sm:gap-x-4 sm:px-6">
          {/* Nowrap and a step down at 320, where the row is otherwise exactly
              the viewport wide and the labels start breaking mid word */}
          <h1 className="type-title mr-auto whitespace-nowrap text-base sm:text-lg">
            iTunes Search
          </h1>

          {/* max-sm rather than hidden, which loses to the inline-flex in the
              button's own base and never hid anything */}
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
              so that is the count it badges, and history stays uncounted */}
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

          {/* Capped rather than free, so an unusually long address cuts itself
              instead of pushing Sign out off the row */}
          <span className="type-meta max-w-[26ch] truncate text-sm max-lg:hidden">
            {user?.email}
          </span>

          {/* Nothing to press a key with, so it only exists where it works */}
          <ShortcutsHelp className="max-sm:hidden" />

          <ThemeToggle />

          {/* Narrower below sm purely to buy slack at 320, where the row
              otherwise lands on exactly the viewport width */}
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

        {/* touch-pan-y, or the browser claims the gesture as a pan the moment
            it moves sideways and cancels the pointer before it ends */}
        <div className="mt-snug touch-pan-y" ref={resultsArea}>
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
