import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import jwt from 'jsonwebtoken';
import app from '../app.js';

// The route calls fetch itself, so stubbing the global would swallow the test's
// own requests too. Hold on to the real one first
const realFetch = globalThis.fetch;

const itunesFetch = vi.fn();
let base;
let server;
let token;

function itunesReply(body) {
  itunesFetch.mockResolvedValueOnce({ json: async () => body });
}

function search(query, bearer = token) {
  const headers = bearer ? { Authorization: `Bearer ${bearer}` } : {};
  return realFetch(`${base}/api/itunes/search${query}`, { headers });
}

beforeAll(async () => {
  vi.stubGlobal('fetch', itunesFetch);

  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;

  const res = await realFetch(`${base}/api/token`);
  token = (await res.json()).token;
});

afterAll(() => {
  vi.unstubAllGlobals();
  server.close();
});

beforeEach(() => {
  itunesFetch.mockReset();
});

describe('the token route', () => {
  it('hands out a signed token', () => {
    expect(jwt.decode(token)).toMatchObject({ app: 'itunes-search' });
  });
});

describe('guarding the search route', () => {
  it('refuses a request with no token', async () => {
    expect((await search('?term=beatles', null)).status).toBe(401);
  });

  it('refuses a token it did not sign', async () => {
    const forged = jwt.sign({ app: 'itunes-search' }, 'not-the-secret');
    expect((await search('?term=beatles', forged)).status).toBe(403);
  });

  it('refuses an expired token', async () => {
    const stale = jwt.sign({ app: 'itunes-search' }, 'dev-secret-key', {
      expiresIn: '-1h',
    });
    expect((await search('?term=beatles', stale)).status).toBe(403);
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
