import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// App reads the session rather than fetching its own token now, so the hook is
// stubbed and every fetch the test sees is a search
const logout = vi.fn();

vi.mock('./context/useAuth', () => ({
  useAuth: () => ({
    token: 'test-token',
    user: { id: 'u1', email: 'jordan.blake@example.test' },
    logout,
  }),
}));

const { default: App } = await import('./App.jsx');
const { OverlayProvider } = await import('./context/OverlayContext.jsx');

// Wrapped the way main.jsx wraps it, so the drawer and the viewer can say they
// are open and the arrow keys can stay out of their way
function renderApp() {
  return render(
    <OverlayProvider>
      <App />
    </OverlayProvider>,
  );
}

const fetchMock = vi.fn();

// App asks for favourites and history the moment it mounts, so a queue of
// replies no longer lines up. Answer by URL instead
let favouritesReply = [];
let searchesReply = [];
let searchReply = {
  ok: true,
  status: 200,
  body: { results: [], resultCount: 0 },
};

function respond(url, options = {}) {
  const method = options.method ?? 'GET';
  const address = String(url);

  if (address.includes('/api/itunes/search')) {
    return {
      ok: searchReply.ok,
      status: searchReply.status,
      json: async () => searchReply.body,
    };
  }

  if (address.includes('/api/favourites')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        favourites: method === 'GET' ? favouritesReply : {},
      }),
    };
  }

  if (address.includes('/api/searches')) {
    // A delete has to actually remove it, or the refetch that follows every
    // history write hands the row straight back
    if (method === 'DELETE') {
      const id = address.split('/api/searches/')[1];
      searchesReply = id ? searchesReply.filter(s => s._id !== id) : [];
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({ searches: method === 'GET' ? searchesReply : {} }),
    };
  }

  return { ok: true, status: 200, json: async () => ({}) };
}

function whenSearchReturns(body, ok = true, status = 200) {
  searchReply = { ok, status, body };
}

function searchCalls() {
  return fetchMock.mock.calls.filter(call =>
    String(call[0]).includes('/api/itunes/search'),
  );
}

function track(n) {
  return {
    trackId: n,
    trackName: `Track ${n}`,
    collectionId: 1,
    collectionName: 'Some Album',
    artistName: 'Jordan Blake',
    artworkUrl100: `https://example.test/${n}.jpg`,
  };
}

async function searchFor(term = 'beatles', mediaLabel) {
  const user = userEvent.setup();
  renderApp();

  const input = screen.getByPlaceholderText(/search itunes/i);

  // The term is still empty here, so picking a type does not run a search of
  // its own the way it would with something already typed
  if (mediaLabel) {
    await user.click(
      screen
        .getByRole('group', { name: /media type/i })
        .querySelector(`[data-media="${mediaLabel}"]`),
    );
  }

  await user.type(input, term);
  await user.click(screen.getByRole('button', { name: /^search$/i }));

  return user;
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation((url, options) =>
    Promise.resolve(respond(url, options)),
  );
  logout.mockReset();
  favouritesReply = [];
  searchesReply = [];
  whenSearchReturns({ results: [], resultCount: 0 });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the signed in header', () => {
  it('shows which account is in use', () => {
    renderApp();

    expect(screen.getByText('jordan.blake@example.test')).toBeInTheDocument();
  });

  it('signs out when asked', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: /sign out/i }));

    expect(logout).toHaveBeenCalledOnce();
  });
});

describe('running a search', () => {
  it('asks for a full page of results and maps the media type', async () => {
    whenSearchReturns({ results: [track(1)], resultCount: 1 });
    await searchFor('hey jude');

    await waitFor(() => expect(searchCalls()).toHaveLength(1));

    const url = new URL(searchCalls()[0][0], 'http://localhost');
    expect(url.searchParams.get('term')).toBe('hey jude');
    expect(url.searchParams.get('limit')).toBe('200');
    expect(url.searchParams.get('media')).toBe('music');
    expect(url.searchParams.get('entity')).toBeNull();
  });

  it.each([
    ['album', 'music', 'album'],
    ['music video', 'musicVideo', null],
    ['podcast', 'podcast', null],
    ['all', null, null],
  ])('sends the right filter for %s', async (label, media, entity) => {
    whenSearchReturns({ results: [], resultCount: 0 });
    await searchFor('adele', label);

    await waitFor(() => expect(searchCalls()).toHaveLength(1));

    const url = new URL(searchCalls()[0][0], 'http://localhost');
    expect(url.searchParams.get('media')).toBe(media);
    expect(url.searchParams.get('entity')).toBe(entity);
  });

  it('sends the token from the session', async () => {
    whenSearchReturns({ results: [], resultCount: 0 });
    await searchFor();

    await waitFor(() => expect(searchCalls()).toHaveLength(1));
    expect(searchCalls()[0][1].headers.Authorization).toBe('Bearer test-token');
  });

  it('fills the grid with placeholders while the search is in flight', async () => {
    let release;
    fetchMock.mockImplementation((url, options) => {
      if (String(url).includes('/api/itunes/search')) {
        return new Promise(resolve => {
          release = () => resolve(respond(url, options));
        });
      }

      return Promise.resolve(respond(url, options));
    });
    whenSearchReturns({ results: [track(1)], resultCount: 1 });

    await searchFor();

    expect(
      await screen.findByRole('status', { name: /searching/i }),
    ).toBeInTheDocument();
    // The empty state belongs to a finished search, not a running one
    expect(screen.queryByText(/nothing matched/i)).not.toBeInTheDocument();

    release();

    expect(await screen.findByText('Track 1')).toBeInTheDocument();
    expect(
      screen.queryByRole('status', { name: /searching/i }),
    ).not.toBeInTheDocument();
  });

  it('says when nothing matched instead of showing an empty panel', async () => {
    whenSearchReturns({ results: [], resultCount: 0 });
    await searchFor();

    expect(await screen.findByText(/nothing matched/i)).toBeInTheDocument();
  });

  it('shows the message the server sent when a search fails', async () => {
    whenSearchReturns({ message: 'Search term is required' }, false, 400);
    await searchFor();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /search term is required/i,
    );
  });

  it('ends the session when the token has stopped working', async () => {
    // Every later search would fail the same way, so showing "Invalid token"
    // over and over is worse than sending them back to the login page
    whenSearchReturns({ message: 'Invalid token' }, false, 403);
    await searchFor();

    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not report an empty result as a failure', async () => {
    whenSearchReturns({ results: [], resultCount: 0 });
    await searchFor();

    await screen.findByText(/nothing matched/i);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('what the account already has', () => {
  it('loads favourites saved in an earlier session', async () => {
    favouritesReply = [
      {
        _id: 'f1',
        itemId: 7,
        title: 'Windmills',
        artist: 'Jordan Blake',
        artwork: 'https://example.test/w.jpg',
      },
    ];

    renderApp();

    expect(await screen.findByText('Windmills')).toBeInTheDocument();
    expect(screen.queryByText(/nothing saved yet/i)).not.toBeInTheDocument();
  });

  it('loads the recent searches', async () => {
    searchesReply = [
      { _id: 's1', term: 'beatles', media: 'music' },
      { _id: 's2', term: 'adele', media: 'album' },
    ];

    renderApp();

    expect(
      await screen.findByRole('button', { name: /^beatles/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^adele/i })).toBeInTheDocument();
  });

  it('shows nothing at all when there is no history', async () => {
    renderApp();

    await screen.findByPlaceholderText(/search itunes/i);
    expect(
      screen.queryByRole('region', { name: /recent searches/i }),
    ).not.toBeInTheDocument();
  });
});

describe('saving a favourite', () => {
  it('sends it in the shape the api stores', async () => {
    whenSearchReturns({ results: [track(1)], resultCount: 1 });
    const user = await searchFor();

    await user.click(
      await screen.findByRole('button', { name: /add favourite/i }),
    );

    const saved = fetchMock.mock.calls.find(
      call =>
        String(call[0]).includes('/api/favourites') &&
        call[1]?.method === 'POST',
    );

    expect(JSON.parse(saved[1].body)).toMatchObject({
      itemId: 1,
      title: 'Track 1',
      artist: 'Jordan Blake',
    });
  });

  it('sends one request however fast the heart is clicked', async () => {
    whenSearchReturns({ results: [track(1)], resultCount: 1 });

    // Held open, so every click below lands while the first one is still out
    let release;
    fetchMock.mockImplementation((url, options) => {
      if (
        String(url).includes('/api/favourites') &&
        options?.method === 'POST'
      ) {
        return new Promise(resolve => {
          release = () => resolve(respond(url, options));
        });
      }

      return Promise.resolve(respond(url, options));
    });

    const user = await searchFor();
    const heart = await screen.findByRole('button', {
      name: /add favourite/i,
    });

    await user.click(heart);
    await user.click(screen.getByRole('button', { name: /remove favourite/i }));
    await user.click(screen.getByRole('button', { name: /remove favourite/i }));

    // The load on mount sends no method at all, so match the two that write
    const writes = fetchMock.mock.calls.filter(
      call =>
        String(call[0]).includes('/api/favourites') &&
        ['POST', 'DELETE'].includes(call[1]?.method),
    );

    // An add and a delete racing each other is how the server ends up holding
    // the opposite of what is on screen
    expect(writes).toHaveLength(1);
    expect(writes[0][1].method).toBe('POST');

    release();
  });

  it('lets it be removed once the save has landed', async () => {
    whenSearchReturns({ results: [track(1)], resultCount: 1 });
    const user = await searchFor();

    await user.click(
      await screen.findByRole('button', { name: /add favourite/i }),
    );
    await user.click(
      await screen.findByRole('button', { name: /remove favourite/i }),
    );

    await waitFor(() => {
      const deleted = fetchMock.mock.calls.find(
        call =>
          String(call[0]).includes('/api/favourites/1') &&
          call[1]?.method === 'DELETE',
      );

      expect(deleted).toBeDefined();
    });

    expect(
      await screen.findByRole('button', { name: /add favourite/i }),
    ).toBeInTheDocument();
  });

  it('takes it off the list again when the server refuses', async () => {
    whenSearchReturns({ results: [track(1)], resultCount: 1 });

    fetchMock.mockImplementation((url, options) => {
      if (
        String(url).includes('/api/favourites') &&
        options?.method === 'POST'
      ) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({ message: 'That is already a favourite.' }),
        });
      }

      return Promise.resolve(respond(url, options));
    });

    const user = await searchFor();
    await user.click(
      await screen.findByRole('button', { name: /add favourite/i }),
    );

    // It appears at once, then goes when the save fails, rather than the click
    // doing nothing for a whole round trip
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /already a favourite/i,
    );
    expect(await screen.findByText(/nothing saved yet/i)).toBeInTheDocument();
  });
});

describe('recent searches', () => {
  beforeEach(() => {
    searchesReply = [{ _id: 's1', term: 'beatles', media: 'podcast' }];
  });

  it('runs one again with its own filter, not the one on screen', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole('button', { name: /^beatles/i }));

    await waitFor(() => expect(searchCalls()).toHaveLength(1));
    const url = new URL(searchCalls()[0][0], 'http://localhost');

    expect(url.searchParams.get('term')).toBe('beatles');
    expect(url.searchParams.get('media')).toBe('podcast');
  });

  it('leaves forgetting to the drawer, so the chips stay quick', async () => {
    renderApp();

    await screen.findByRole('button', { name: /^beatles/i });

    expect(
      screen.queryByRole('button', { name: /forget beatles/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /clear all/i }),
    ).not.toBeInTheDocument();
  });
});

describe('when part of the account will not load', () => {
  it('keeps the history when the favourites request fails', async () => {
    searchesReply = [{ _id: 's1', term: 'beatles', media: 'podcast' }];

    fetchMock.mockImplementation((url, options) => {
      if (String(url).includes('/api/favourites')) {
        return Promise.reject(new Error('Could not reach the server.'));
      }

      return Promise.resolve(respond(url, options));
    });

    renderApp();

    // Two unrelated lists, so one failing must not take the other with it
    expect(
      await screen.findByRole('button', { name: /^beatles/i }),
    ).toBeInTheDocument();
  });
});

describe('the library drawer', () => {
  beforeEach(() => {
    searchesReply = [{ _id: 's1', term: 'beatles', media: 'podcast' }];
  });

  async function openHistory(user) {
    await user.click(
      await screen.findByRole('button', { name: /history, 1 searches/i }),
    );

    return screen.getByRole('tabpanel');
  }

  it('opens on the tab the header button asked for', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(
      await screen.findByRole('button', { name: /favourites, 0 saved/i }),
    );
    expect(screen.getByRole('tab', { name: /favourites/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.click(screen.getByRole('tab', { name: /history/i }));
    expect(screen.getByRole('tab', { name: /history/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('forgets one search', async () => {
    const user = userEvent.setup();
    renderApp();

    const panel = await openHistory(user);
    await user.click(
      within(panel).getByRole('button', { name: /forget beatles/i }),
    );

    await waitFor(() => {
      const deleted = fetchMock.mock.calls.find(
        call =>
          String(call[0]).includes('/api/searches/s1') &&
          call[1]?.method === 'DELETE',
      );

      expect(deleted).toBeDefined();
    });
  });

  it('clears the lot', async () => {
    const user = userEvent.setup();
    renderApp();

    const panel = await openHistory(user);
    await user.click(within(panel).getByRole('button', { name: /clear all/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: /recent searches/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it('forgets two rows without the first blocking the second', async () => {
    searchesReply = [
      { _id: 's1', term: 'beatles', media: 'podcast' },
      { _id: 's2', term: 'queen', media: 'album' },
    ];

    const user = userEvent.setup();
    renderApp();

    await user.click(
      await screen.findByRole('button', { name: /history, 2 searches/i }),
    );

    const panel = screen.getByRole('tabpanel');
    await user.click(
      within(panel).getByRole('button', { name: /forget beatles/i }),
    );
    await user.click(
      within(panel).getByRole('button', { name: /forget queen/i }),
    );

    // A guard over the whole list would make the second click do nothing
    await waitFor(() => {
      const deleted = fetchMock.mock.calls.filter(
        call =>
          String(call[0]).includes('/api/searches/') &&
          call[1]?.method === 'DELETE',
      );

      expect(deleted).toHaveLength(2);
    });
  });

  it('puts a search back when the server cannot be reached at all', async () => {
    // The refetch talks to the same server, so restoring by asking it would
    // leave the row gone on screen and present on the server
    let reachable = true;

    fetchMock.mockImplementation((url, options) => {
      if (!reachable && String(url).includes('/api/searches')) {
        return Promise.reject(new Error('Could not reach the server.'));
      }

      return Promise.resolve(respond(url, options));
    });

    const user = userEvent.setup();
    renderApp();

    const panel = await openHistory(user);
    reachable = false;

    await user.click(
      within(panel).getByRole('button', { name: /forget beatles/i }),
    );

    expect(
      await within(screen.getByRole('tabpanel')).findByRole('button', {
        name: /^beatles/i,
      }),
    ).toBeInTheDocument();
  });

  it('puts a search back when the server refuses to forget it', async () => {
    fetchMock.mockImplementation((url, options) => {
      if (
        String(url).includes('/api/searches/s1') &&
        options?.method === 'DELETE'
      ) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Could not forget that search.' }),
        });
      }

      return Promise.resolve(respond(url, options));
    });

    const user = userEvent.setup();
    renderApp();

    const panel = await openHistory(user);
    await user.click(
      within(panel).getByRole('button', { name: /forget beatles/i }),
    );

    // Gone from the screen but still on the server is the worst of both
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not forget/i);
    // Inside the drawer, or it renders under the drawer's own backdrop
    expect(alert.closest('aside')).toHaveAttribute('aria-label', 'Library');
    expect(
      within(screen.getByRole('tabpanel')).getByRole('button', {
        name: /^beatles/i,
      }),
    ).toBeInTheDocument();
  });

  it('runs a search again and gets out of the way', async () => {
    const user = userEvent.setup();
    renderApp();

    const panel = await openHistory(user);
    // Anchored, or it also matches the Forget button beside it
    await user.click(within(panel).getByRole('button', { name: /^beatles/i }));

    await waitFor(() => expect(searchCalls()).toHaveLength(1));
    // Leaving the panel over the results it just fetched would be odd
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
  });
});

describe('saying where you are', () => {
  it('introduces the app until something has been searched', async () => {
    whenSearchReturns({ results: [track(1)], resultCount: 1 });
    renderApp();

    expect(screen.getByText(/everything apple has/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/search itunes/i), 'beatles');
    await user.click(screen.getByRole('button', { name: /^search$/i }));

    await screen.findByText('Track 1');
    expect(screen.queryByText(/everything apple has/i)).not.toBeInTheDocument();
  });

  it('names the search the results came from, not what is in the box', async () => {
    whenSearchReturns({ results: [track(1)], resultCount: 1 });
    const user = await searchFor('hey jude');

    expect(
      await screen.findByText(/results for hey jude/i),
    ).toBeInTheDocument();
    expect(screen.getByText('1 result')).toBeInTheDocument();

    // Typing again must not rewrite the heading over results it did not fetch
    await user.type(screen.getByPlaceholderText(/search itunes/i), ' live');
    expect(screen.getByText(/results for hey jude/i)).toBeInTheDocument();
  });

  it('keeps the count and the page on screen while paging', async () => {
    whenSearchReturns({
      results: Array.from({ length: 90 }, (_, i) => track(i + 1)),
      resultCount: 90,
    });
    const user = await searchFor();

    expect(
      await screen.findByText('90 results · Page 1 of 3'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(
      await screen.findByText('90 results · Page 2 of 3'),
    ).toBeInTheDocument();
  });
});

describe('the shortcuts sheet', () => {
  it('opens from the header, but not inside it', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(
      screen.getByRole('button', { name: /keyboard shortcuts/i }),
    );

    const sheet = screen.getByRole('dialog', { name: /keyboard shortcuts/i });

    expect(sheet).toHaveTextContent('Jump to the search box');
    // The header has a backdrop-filter, which would make it the containing
    // block for a fixed child and put the sheet up in the header's own box
    expect(sheet.closest('header')).toBeNull();
    expect(sheet.parentElement).toBe(document.body);
  });

  it('opens on the question mark, and not while typing one', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByPlaceholderText(/search itunes/i));
    await user.keyboard('?');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(document.body);
    await user.keyboard('?');
    expect(
      screen.getByRole('dialog', { name: /keyboard shortcuts/i }),
    ).toBeInTheDocument();
  });
});

describe('sorting the results', () => {
  // Reverse alphabetical as they arrive, so relevance and title differ
  const backwards = [
    { ...track(1), trackName: 'Zephyr' },
    { ...track(2), trackName: 'Marigold' },
    { ...track(3), trackName: 'Aubade' },
  ];

  function firstCard() {
    return screen.getAllByRole('button', { name: /^view /i })[0];
  }

  it('reorders without asking the server again', async () => {
    whenSearchReturns({ results: backwards, resultCount: 3 });
    const user = await searchFor();

    await screen.findByText('3 results');
    const callsAfterSearch = searchCalls().length;

    await user.selectOptions(screen.getByLabelText(/sort/i), 'title');

    expect(firstCard()).toHaveAccessibleName('View Aubade');
    expect(searchCalls()).toHaveLength(callsAfterSearch);
  });

  it('turns the order around on the arrow', async () => {
    whenSearchReturns({ results: backwards, resultCount: 3 });
    const user = await searchFor();

    await screen.findByText('3 results');
    await user.selectOptions(screen.getByLabelText(/sort/i), 'title');
    await user.click(
      screen.getByRole('button', { name: /reverse the order/i }),
    );

    expect(firstCard()).toHaveAccessibleName('View Zephyr');
  });

  it('sorts every page, not the forty on screen', async () => {
    // Named so the last one to arrive is the first one alphabetically, and it
    // is on page three until the sort moves it
    const ninety = Array.from({ length: 90 }, (_, i) =>
      i === 89
        ? { ...track(90), trackName: 'Aardvark' }
        : { ...track(i + 1), trackName: `Zz Track ${i + 1}` },
    );

    whenSearchReturns({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText(/90 results/);
    expect(screen.queryByText('Aardvark')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/sort/i), 'title');

    expect(screen.getByText('Aardvark')).toBeInTheDocument();
  });

  it('goes back to page one, since page three was the old order', async () => {
    whenSearchReturns({
      results: Array.from({ length: 90 }, (_, i) => track(i + 1)),
      resultCount: 90,
    });
    const user = await searchFor();

    await screen.findByText('90 results · Page 1 of 3');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByText('90 results · Page 2 of 3');

    await user.selectOptions(screen.getByLabelText(/sort/i), 'title');

    expect(
      await screen.findByText('90 results · Page 1 of 3'),
    ).toBeInTheDocument();
  });
});

describe('paging by swiping', () => {
  const ninety = Array.from({ length: 90 }, (_, i) => track(i + 1));

  // Any card will do, since the gesture is bound to the grid around them and
  // the events bubble. Whichever page is up has a first one
  const grid = () => screen.getAllByRole('button', { name: /^View / })[0];

  const swipe = (user, { from, to, touch = true }) =>
    user.pointer([
      {
        keys: touch ? '[TouchA>]' : '[MouseLeft>]',
        target: grid(),
        coords: { clientX: from[0], clientY: from[1] },
      },
      {
        pointerName: touch ? 'TouchA' : 'mouse',
        coords: { clientX: to[0], clientY: to[1] },
      },
      { keys: touch ? '[/TouchA]' : '[/MouseLeft]' },
    ]);

  it('moves a page on a swipe either way', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText('Page 1 of 3');

    await swipe(user, { from: [260, 400], to: [60, 405] });
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();

    await swipe(user, { from: [60, 400], to: [260, 405] });
    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('leaves a scroll that drifted sideways alone', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText('Page 1 of 3');
    await swipe(user, { from: [200, 600], to: [130, 180] });

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('ignores a short drag, which is a tap that moved', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText('Page 1 of 3');
    await swipe(user, { from: [200, 400], to: [160, 402] });

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('ignores the same drag from a mouse', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText('Page 1 of 3');
    await swipe(user, { from: [260, 400], to: [60, 405], touch: false });

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  // jsdom has no pan handling, so nothing above would notice this going missing.
  // A real browser cancels the pointer mid gesture without it and the swipe
  // silently stops working
  it('tells the browser the grid only pans vertically', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    await searchFor();

    await screen.findByText('Page 1 of 3');
    const area = screen
      .getAllByRole('button', { name: /^View / })[0]
      .closest('.touch-pan-y');

    expect(area).not.toBeNull();
  });

  it('leaves swiping alone while the artwork viewer is open', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText('Page 1 of 3');
    await user.click(screen.getByRole('button', { name: 'View Track 1' }));
    await swipe(user, { from: [260, 400], to: [60, 405] });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });
});

describe('paging by the keyboard', () => {
  const ninety = Array.from({ length: 90 }, (_, i) => track(i + 1));

  it('moves with the arrow keys', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText('Page 1 of 3');

    await user.keyboard('{ArrowRight}');
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('leaves the arrows alone while typing a search', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText('Page 1 of 3');
    await user.click(screen.getByPlaceholderText(/search itunes/i));
    await user.keyboard('{ArrowRight}');

    // Moving the caret through a term must not throw the page away
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('leaves the arrows alone while the drawer is open', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText('Page 1 of 3');
    await user.click(
      screen.getByRole('button', { name: /favourites, 0 saved/i }),
    );
    await user.keyboard('{ArrowRight}');

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('leaves the arrows alone while the artwork viewer is open', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText('Page 1 of 3');
    // Exact, or it also matches Track 10 through Track 19
    await user.click(screen.getByRole('button', { name: 'View Track 1' }));
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('sends the slash key to the search box', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText('Page 1 of 3');
    const field = screen.getByPlaceholderText(/search itunes/i);
    field.blur();

    await user.keyboard('/');

    expect(field).toHaveFocus();
    // The slash itself belongs to the shortcut, not to the term
    expect(field).toHaveValue('beatles');
  });
});

describe('paging through the results', () => {
  const ninety = Array.from({ length: 90 }, (_, i) => track(i + 1));

  it('shows forty at a time and counts the pages', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    await searchFor();

    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Track 40')).toBeInTheDocument();
    expect(screen.queryByText('Track 41')).not.toBeInTheDocument();
  });

  it('moves forward and back without asking the server again', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText('Page 1 of 3');
    const callsAfterSearch = searchCalls().length;

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Track 41')).toBeInTheDocument();
    expect(screen.queryByText('Track 1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /prev/i }));
    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Track 1')).toBeInTheDocument();

    expect(searchCalls()).toHaveLength(callsAfterSearch);
  });

  it('stops at both ends', async () => {
    whenSearchReturns({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText('Page 1 of 3');
    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(await screen.findByText('Page 3 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    expect(screen.getByText('Track 90')).toBeInTheDocument();
  });

  it('hides the controls when everything fits on one page', async () => {
    whenSearchReturns({ results: ninety.slice(0, 12), resultCount: 12 });
    await searchFor();

    await screen.findByText('Track 1');
    expect(
      screen.queryByRole('button', { name: /next/i }),
    ).not.toBeInTheDocument();
  });
});

describe('the favourites drawer', () => {
  it('counts what is saved without being opened', async () => {
    favouritesReply = [
      { _id: 'f1', itemId: 7, title: 'Windmills', artist: 'Jordan Blake' },
      { _id: 'f2', itemId: 8, title: 'Harbour', artist: 'Jordan Blake' },
    ];

    renderApp();

    expect(
      await screen.findByRole('button', { name: /favourites, 2 saved/i }),
    ).toBeInTheDocument();
  });

  it('opens and shuts', async () => {
    const user = userEvent.setup();
    renderApp();

    // Shut, the drawer is aria-hidden, so nothing inside it is reachable
    expect(
      screen.queryByRole('button', { name: /close library/i }),
    ).not.toBeInTheDocument();

    await user.click(
      await screen.findByRole('button', { name: /favourites, 0 saved/i }),
    );
    expect(
      screen.getByRole('button', { name: /close library/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close library/i }));
    expect(
      screen.queryByRole('button', { name: /close library/i }),
    ).not.toBeInTheDocument();
  });

  it('shuts on escape, which is what people try first', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(
      await screen.findByRole('button', { name: /favourites, 0 saved/i }),
    );
    expect(
      screen.getByRole('button', { name: /close library/i }),
    ).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('button', { name: /close library/i }),
    ).not.toBeInTheDocument();
  });
});
