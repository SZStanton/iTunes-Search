import { render, screen, waitFor } from '@testing-library/react';
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
  render(<App />);

  const input = screen.getByPlaceholderText(/search itunes/i);

  if (mediaLabel) {
    await user.selectOptions(screen.getByRole('combobox'), mediaLabel);
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
    render(<App />);

    expect(screen.getByText('jordan.blake@example.test')).toBeInTheDocument();
  });

  it('signs out when asked', async () => {
    const user = userEvent.setup();
    render(<App />);

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

    render(<App />);

    expect(await screen.findByText('Windmills')).toBeInTheDocument();
    expect(screen.queryByText(/no favourites yet/i)).not.toBeInTheDocument();
  });

  it('loads the recent searches', async () => {
    searchesReply = [
      { _id: 's1', term: 'beatles', media: 'music' },
      { _id: 's2', term: 'adele', media: 'album' },
    ];

    render(<App />);

    expect(
      await screen.findByRole('button', { name: /^beatles/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^adele/i })).toBeInTheDocument();
  });

  it('shows nothing at all when there is no history', async () => {
    render(<App />);

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
    expect(await screen.findByText(/no favourites yet/i)).toBeInTheDocument();
  });
});

describe('recent searches', () => {
  beforeEach(() => {
    searchesReply = [{ _id: 's1', term: 'beatles', media: 'podcast' }];
  });

  it('runs one again with its own filter, not the one on screen', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /^beatles/i }));

    await waitFor(() => expect(searchCalls()).toHaveLength(1));
    const url = new URL(searchCalls()[0][0], 'http://localhost');

    expect(url.searchParams.get('term')).toBe('beatles');
    expect(url.searchParams.get('media')).toBe('podcast');
  });

  it('forgets one on request', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      await screen.findByRole('button', { name: /forget beatles/i }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /^beatles/i }),
      ).not.toBeInTheDocument(),
    );

    const deleted = fetchMock.mock.calls.find(
      call =>
        String(call[0]).includes('/api/searches/s1') &&
        call[1]?.method === 'DELETE',
    );

    expect(deleted).toBeDefined();
  });

  it('clears the lot on request', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /clear all/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: /recent searches/i }),
      ).not.toBeInTheDocument(),
    );
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

    render(<App />);

    expect(
      await screen.findByRole('button', { name: /favourites, 2 saved/i }),
    ).toBeInTheDocument();
  });

  it('opens and shuts', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Shut, the drawer is aria-hidden, so nothing inside it is reachable
    expect(
      screen.queryByRole('button', { name: /^close$/i }),
    ).not.toBeInTheDocument();

    await user.click(
      await screen.findByRole('button', { name: /favourites, 0 saved/i }),
    );
    expect(
      screen.getByRole('button', { name: /^close$/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^close$/i }));
    expect(
      screen.queryByRole('button', { name: /^close$/i }),
    ).not.toBeInTheDocument();
  });

  it('shuts on escape, which is what people try first', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      await screen.findByRole('button', { name: /favourites, 0 saved/i }),
    );
    expect(
      screen.getByRole('button', { name: /^close$/i }),
    ).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('button', { name: /^close$/i }),
    ).not.toBeInTheDocument();
  });
});
