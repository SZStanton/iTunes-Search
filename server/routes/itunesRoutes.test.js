import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

// Looking a user up needs a database, and these tests are about the search
// route rather than the guard. auth.test.js covers the guard itself
vi.mock('../middleware/auth.js', () => ({
  default: (req, res, next) => {
    req.user = { id: 'test-user' };
    next();
  },
}));

const { default: app } = await import('../app.js');

// The route calls fetch itself, so stubbing the global would swallow the test's
// own requests too. Hold on to the real one first
const realFetch = globalThis.fetch;

const itunesFetch = vi.fn();
let base;
let server;

function itunesReply(body) {
  itunesFetch.mockResolvedValueOnce({ json: async () => body });
}

function search(query) {
  return realFetch(`${base}/api/itunes/search${query}`);
}

beforeAll(async () => {
  vi.stubGlobal('fetch', itunesFetch);

  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => {
  vi.unstubAllGlobals();
  server.close();
});

beforeEach(() => {
  itunesFetch.mockReset();
});

describe('the health check', () => {
  it('answers without a token, so it can be used to wake the api', async () => {
    const res = await realFetch(`${base}/api/health`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});

describe('searching', () => {
  it('needs a search term', async () => {
    const res = await search('');

    expect(res.status).toBe(400);
    expect((await res.json()).message).toMatch(/term/i);
    expect(itunesFetch).not.toHaveBeenCalled();
  });

  it('treats an empty term as missing', async () => {
    expect((await search('?term=')).status).toBe(400);
    expect(itunesFetch).not.toHaveBeenCalled();
  });

  it('passes the term and media type on to itunes', async () => {
    itunesReply({ results: [], resultCount: 0 });
    await search('?term=hey%20jude&media=music');

    const [url] = itunesFetch.mock.calls[0];
    expect(url).toContain('term=hey+jude');
    expect(url).toContain('media=music');
  });

  it('leaves media off entirely when none is chosen', async () => {
    itunesReply({ results: [], resultCount: 0 });
    await search('?term=hey%20jude&media=');

    expect(itunesFetch.mock.calls[0][0]).not.toContain('media=');
  });

  it('passes an entity through, which is how Album is asked for', async () => {
    itunesReply({ results: [], resultCount: 0 });
    await search('?term=adele&media=music&entity=album');

    const url = new URL(itunesFetch.mock.calls[0][0]);
    expect(url.searchParams.get('media')).toBe('music');
    expect(url.searchParams.get('entity')).toBe('album');
  });

  it('leaves entity off when the filter does not need one', async () => {
    itunesReply({ results: [], resultCount: 0 });
    await search('?term=adele&media=musicVideo');

    expect(itunesFetch.mock.calls[0][0]).not.toContain('entity=');
  });

  it('returns what itunes sent back', async () => {
    itunesReply({
      results: [
        {
          trackId: 1,
          trackName: 'Here Comes the Sun',
          collectionName: 'Abbey Road',
          artistName: 'The Beatles',
          artworkUrl100: 'https://example.test/100x100bb.jpg',
        },
      ],
      resultCount: 1,
    });

    const res = await search('?term=beatles');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].trackName).toBe('Here Comes the Sun');
  });

  it('reports a failure at itunes rather than throwing', async () => {
    itunesFetch.mockRejectedValueOnce(new Error('itunes is down'));

    const res = await search('?term=beatles');

    expect(res.status).toBe(500);
    expect((await res.json()).message).toMatch(/failed/i);
  });
});

describe('how many results are asked for', () => {
  async function limitSentFor(query) {
    itunesReply({ results: [], resultCount: 0 });
    await search(query);
    return new URL(itunesFetch.mock.calls[0][0]).searchParams.get('limit');
  }

  it('asks for forty when none is given', async () => {
    expect(await limitSentFor('?term=beatles')).toBe('40');
  });

  it('passes a sensible limit straight through', async () => {
    expect(await limitSentFor('?term=beatles&limit=120')).toBe('120');
  });

  it('will not ask itunes for more than it can return', async () => {
    expect(await limitSentFor('?term=beatles&limit=5000')).toBe('200');
  });

  it('ignores a limit that is not a number', async () => {
    expect(await limitSentFor('?term=beatles&limit=lots')).toBe('40');
  });

  it('ignores a limit of zero or less', async () => {
    expect(await limitSentFor('?term=beatles&limit=-10')).toBe('40');
  });
});

describe('artwork', () => {
  it('offers a bigger version alongside the one itunes sent', async () => {
    itunesReply({
      results: [
        {
          trackId: 1,
          trackName: 'Here Comes the Sun',
          artworkUrl100: 'https://example.test/a/b/100x100bb.jpg',
        },
      ],
      resultCount: 1,
    });

    const body = await (await search('?term=beatles')).json();

    expect(body.results[0].artworkUrl600).toBe(
      'https://example.test/a/b/600x600bb.jpg',
    );
    expect(body.results[0].artworkUrl100).toBe(
      'https://example.test/a/b/100x100bb.jpg',
    );
  });

  it('leaves a url alone when it has no size to swap', async () => {
    itunesReply({
      results: [
        {
          trackId: 1,
          trackName: 'Odd One',
          artworkUrl100: 'https://example.test/no-size-here.jpg',
        },
      ],
      resultCount: 1,
    });

    const body = await (await search('?term=beatles')).json();

    expect(body.results[0].artworkUrl600).toBe(
      'https://example.test/no-size-here.jpg',
    );
  });
});

describe('the result count', () => {
  it('counts what is sent back, not what itunes counted', async () => {
    itunesReply({
      // The middle one has no artwork, so it cannot be drawn and is dropped
      results: [
        {
          trackId: 1,
          trackName: 'Here Comes the Sun',
          artworkUrl100: 'https://example.test/a.jpg',
        },
        { trackId: 2, trackName: 'No Artwork' },
        {
          trackId: 3,
          trackName: 'Come Together',
          artworkUrl100: 'https://example.test/c.jpg',
        },
      ],
      resultCount: 3,
    });

    const body = await (await search('?term=beatles')).json();

    expect(body.results).toHaveLength(2);
    expect(body.resultCount).toBe(2);
  });
});
