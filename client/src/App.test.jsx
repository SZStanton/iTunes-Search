import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const fetchMock = vi.fn();

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

function jsonOnce(body, ok = true, status = 200) {
  fetchMock.mockResolvedValueOnce({ ok, status, json: async () => body });
}

// Every render starts by asking for a token, so answer that first
function tokenThen(body, ok = true, status = 200) {
  jsonOnce({ token: 'test-token' });
  jsonOnce(body, ok, status);
}

async function searchFor(term = 'beatles', mediaLabel) {
  const user = userEvent.setup();
  render(<App />);

  const input = screen.getByPlaceholderText(/search itunes/i);
  const button = screen.getByRole('button', { name: /^search$/i });

  await waitFor(() => expect(button).toBeEnabled());
  if (mediaLabel) {
    await user.selectOptions(screen.getByRole('combobox'), mediaLabel);
  }
  await user.type(input, term);
  await user.click(button);

  return user;
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getting a token first', () => {
  it('will not let a search run before the token arrives', async () => {
    let releaseToken;
    fetchMock.mockReturnValueOnce(
      new Promise(resolve => {
        releaseToken = () =>
          resolve({ ok: true, json: async () => ({ token: 't' }) });
      }),
    );

    render(<App />);

    expect(screen.getByRole('button', { name: /^search$/i })).toBeDisabled();

    releaseToken();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^search$/i })).toBeEnabled(),
    );
  });

  it('says so when the server cannot be reached', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not reach the server/i,
    );
  });
});

describe('running a search', () => {
  it('asks for a full page of results and maps the media type', async () => {
    tokenThen({ results: [track(1)], resultCount: 1 });
    await searchFor('hey jude');

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const url = new URL(fetchMock.mock.calls[1][0], 'http://localhost');
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
    tokenThen({ results: [], resultCount: 0 });
    await searchFor('adele', label);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const url = new URL(fetchMock.mock.calls[1][0], 'http://localhost');
    expect(url.searchParams.get('media')).toBe(media);
    expect(url.searchParams.get('entity')).toBe(entity);
  });

  it('sends the token it was given', async () => {
    tokenThen({ results: [], resultCount: 0 });
    await searchFor();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe(
      'Bearer test-token',
    );
  });

  it('says when nothing matched instead of showing an empty panel', async () => {
    tokenThen({ results: [], resultCount: 0 });
    await searchFor();

    expect(await screen.findByText(/nothing matched/i)).toBeInTheDocument();
  });

  it('shows the message the server sent when a search fails', async () => {
    tokenThen({ message: 'Search term is required' }, false, 400);
    await searchFor();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /search term is required/i,
    );
  });

  it('does not report an empty result as a failure', async () => {
    tokenThen({ results: [], resultCount: 0 });
    await searchFor();

    await screen.findByText(/nothing matched/i);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('paging through the results', () => {
  const ninety = Array.from({ length: 90 }, (_, i) => track(i + 1));

  it('shows forty at a time and counts the pages', async () => {
    tokenThen({ results: ninety, resultCount: 90 });
    await searchFor();

    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Track 40')).toBeInTheDocument();
    expect(screen.queryByText('Track 41')).not.toBeInTheDocument();
  });

  it('moves forward and back without asking the server again', async () => {
    tokenThen({ results: ninety, resultCount: 90 });
    const user = await searchFor();

    await screen.findByText('Page 1 of 3');
    const callsAfterSearch = fetchMock.mock.calls.length;

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Track 41')).toBeInTheDocument();
    expect(screen.queryByText('Track 1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /prev/i }));
    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Track 1')).toBeInTheDocument();

    expect(fetchMock.mock.calls).toHaveLength(callsAfterSearch);
  });

  it('stops at both ends', async () => {
    tokenThen({ results: ninety, resultCount: 90 });
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
    tokenThen({ results: ninety.slice(0, 12), resultCount: 12 });
    await searchFor();

    await screen.findByText('Track 1');
    expect(
      screen.queryByRole('button', { name: /next/i }),
    ).not.toBeInTheDocument();
  });
});
